'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { changeMyPassword, updateMyContact, uploadMyPhoto } from '@/api/auth/api';
import { authKeys, authQueries } from '@/api/auth/queries';
import type { MemberContactUpdateRequest, PasswordChangeRequest } from '@/api/auth/types';
import { validateMemberPhoto } from '@/api/member/api';
import { ApiError } from '@/api/client';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Field, INPUT_CLASS } from '@/components/ui/field';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { useSession } from '@/lib/auth/use-session';
import { formatPhoneNumber, mapCaretToFormatted } from '@/lib/format-phone';
import { MEMBER_TYPE_LABELS, TRACK_LABELS } from '@/lib/member-labels';

interface ContactBaseline {
  phone: string;
  email: string;
  github: string;
}

export default function ProfilePage() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const {
    data: detail,
    isLoading,
    error: loadError,
  } = useQuery({ ...authQueries.me(session?.accessToken ?? ''), enabled: !!session });

  const [baseline, setBaseline] = useState<ContactBaseline | null>(null);
  const [seededDetailId, setSeededDetailId] = useState<number | null>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [github, setGithub] = useState('');
  const [curPassword, setCurPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pickedPhoto, setPickedPhoto] = useState<{ file: File; previewUrl: string } | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // 데이터가 처음 도착했을 때만 편집 상태를 초기값으로 맞춘다(React 공식 패턴 —
  // "조건부로 렌더 중 state를 조정"; effect로 하면 여분의 렌더가 한 번 더 생긴다).
  if (detail && detail.id !== seededDetailId) {
    const seeded: ContactBaseline = {
      phone: detail.phoneNumber ? formatPhoneNumber(detail.phoneNumber) : '',
      email: detail.email,
      github: detail.githubId ?? '',
    };
    setSeededDetailId(detail.id);
    setBaseline(seeded);
    setPhone(seeded.phone);
    setEmail(seeded.email);
    setGithub(seeded.github);
  }

  const contactMutation = useMutation({
    mutationFn: (body: MemberContactUpdateRequest) => updateMyContact(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.me() }),
  });

  const passwordMutation = useMutation({
    mutationFn: (body: PasswordChangeRequest) => changeMyPassword(body),
  });

  const photoMutation = useMutation({
    mutationFn: (file: File) => uploadMyPhoto(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
      setPickedPhoto(null);
    },
    onError: (e) => setPhotoError(e instanceof Error ? e.message : '사진 업로드에 실패했습니다.'),
  });

  // 미리보기 blob URL 해제만 맡는다 — 생성은 파일을 고른 순간에 한다(MemberPhotoModal과 같은 패턴).
  useEffect(() => {
    if (!pickedPhoto) {
      return;
    }
    const { previewUrl } = pickedPhoto;
    return () => URL.revokeObjectURL(previewUrl);
  }, [pickedPhoto]);

  function handlePickPhoto(file: File) {
    const validationError = validateMemberPhoto(file);
    if (validationError) {
      setPickedPhoto(null);
      setPhotoError(validationError);
      return;
    }
    setPhotoError(null);
    const picked = { file, previewUrl: URL.createObjectURL(file) };
    setPickedPhoto(picked);
    photoMutation.mutate(file);
  }

  function handlePhoneChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const caret = input.selectionStart ?? input.value.length;
    const digitsBeforeCaret = input.value.slice(0, caret).replace(/\D/g, '').length;
    const formatted = formatPhoneNumber(input.value);
    setPhone(formatted);

    const nextCaret = mapCaretToFormatted(formatted, digitsBeforeCaret);
    requestAnimationFrame(() => {
      phoneInputRef.current?.setSelectionRange(nextCaret, nextCaret);
    });
  }

  const contactDirty =
    !!baseline && (phone !== baseline.phone || email !== baseline.email || github !== baseline.github);
  const passwordTouched = !!(curPassword || newPassword || confirmPassword);
  const dirty = contactDirty || passwordTouched;

  const mismatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword;
  const passwordIncomplete = passwordTouched && !(curPassword && newPassword && confirmPassword && !mismatch);
  const saveDisabled = !dirty || passwordIncomplete;
  const saving = contactMutation.isPending || passwordMutation.isPending;

  function discard() {
    if (baseline) {
      setPhone(baseline.phone);
      setEmail(baseline.email);
      setGithub(baseline.github);
    }
    setCurPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSaveError(null);
  }

  async function save() {
    if (saveDisabled || saving) return;
    setSaveError(null);
    try {
      if (contactDirty) {
        await contactMutation.mutateAsync({ phoneNumber: phone || null, email, githubId: github || null });
        setBaseline({ phone, email, github });
      }
      if (passwordTouched) {
        await passwordMutation.mutateAsync({
          currentPassword: curPassword,
          newPassword,
          newPasswordConfirm: confirmPassword,
        });
      }
      setCurPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : '저장에 실패했습니다.');
    }
  }

  if (!session || isLoading || (!detail && !loadError)) {
    return (
      <>
        <PageHeader crumb="내 정보" title="내 정보 수정" />
        <p className="text-faint px-8 pt-6 text-[13px]">불러오는 중...</p>
      </>
    );
  }

  if (loadError || !detail) {
    return (
      <>
        <PageHeader crumb="내 정보" title="내 정보 수정" />
        <p className="text-danger px-8 pt-6 text-[13px]">
          {loadError instanceof ApiError ? loadError.message : '정보를 불러오지 못했습니다.'}
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader crumb="내 정보" title="내 정보 수정" saving={saving} />

      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5 px-8 pt-7 pb-[100px]">
        <div className="border-line bg-panel flex items-center gap-[18px] rounded-2xl border p-[22px]">
          <label className="group relative flex-none cursor-pointer">
            <Avatar src={pickedPhoto?.previewUrl ?? detail.photoUrl} name={detail.name} size="xl" />
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-[10px] font-medium text-transparent transition-colors group-hover:bg-black/40 group-hover:text-white">
              {photoMutation.isPending ? '업로드 중…' : '변경'}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={photoMutation.isPending}
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) {
                  handlePickPhoto(selected);
                }
                e.target.value = '';
              }}
            />
          </label>
          <div className="flex min-w-0 flex-col gap-1">
            <div className="text-[15px] font-semibold whitespace-nowrap">{detail.name}</div>
            <div className="text-faint text-[12px] whitespace-nowrap">
              {detail.studentNumber} · {TRACK_LABELS[detail.track]} · {detail.generation}
            </div>
            {photoError && <div className="text-danger text-[11px]">{photoError}</div>}
          </div>
        </div>

        <SectionCard title="관리자 등록 정보" caption="읽기 전용">
          <div className="grid grid-cols-2 gap-2.5">
            <ReadOnlyField label="이름" value={detail.name} />
            <ReadOnlyField label="학번" value={detail.studentNumber} />
            <ReadOnlyField label="트랙" value={TRACK_LABELS[detail.track]} />
            <ReadOnlyField label="기수" value={detail.generation} />
            <ReadOnlyField label="구분" value={MEMBER_TYPE_LABELS[detail.memberType]} />
            <ReadOnlyField label="소속" value={detail.university} />
          </div>
          <p className="text-faint mt-3 text-[11px] leading-[1.6]">
            위 정보는 관리자만 수정할 수 있어요. 변경이 필요하면 운영진에게 문의해주세요.
          </p>
        </SectionCard>

        <SectionCard title="연락처 정보">
          <div className="flex flex-col gap-3.5">
            <Field label="전화번호">
              <input
                ref={phoneInputRef}
                type="tel"
                placeholder="010-0000-0000"
                value={phone}
                onChange={handlePhoneChange}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="이메일">
              <input
                type="email"
                placeholder="mail@bcsdlab.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="깃허브 아이디">
              <input
                type="text"
                placeholder="아이디만 입력 (예: bcsdlab)"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="비밀번호 변경">
          <div className="flex flex-col gap-3.5">
            <Field label="현재 비밀번호">
              <input
                type="password"
                placeholder="현재 비밀번호 입력"
                value={curPassword}
                onChange={(e) => setCurPassword(e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3.5">
              <Field label="새 비밀번호">
                <input
                  type="password"
                  placeholder="8자 이상, 영문+숫자"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
              <Field label="새 비밀번호 확인" hint={mismatch ? '비밀번호가 일치하지 않아요.' : undefined}>
                <input
                  type="password"
                  placeholder="다시 입력"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${INPUT_CLASS} ${mismatch ? 'border-danger-line' : ''}`}
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        {saveError && <p className="text-danger m-0 text-[11.5px]">{saveError}</p>}
      </div>

      {dirty && (
        <div className="border-line bg-panel2 sticky bottom-0 left-0 flex items-center gap-2.5 border-t px-8 py-3.5">
          <span className="text-faint text-[11px] whitespace-nowrap">저장하지 않은 변경사항이 있어요</span>
          <Button onClick={discard} className="ml-auto px-4 py-2.5">
            취소
          </Button>
          <Button variant="primary" onClick={save} disabled={saveDisabled || saving} className="px-[18px] py-2.5">
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      )}
    </>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-panel2 rounded-[10px] px-3.5 py-[11px]">
      <div className="text-faint mb-[3px] text-[11px]">{label}</div>
      <div className="text-[13.5px] font-medium">{value}</div>
    </div>
  );
}

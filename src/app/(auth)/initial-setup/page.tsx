'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ChangeEvent, type SubmitEvent } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { LogoBadge } from '@/components/auth/LogoBadge';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { TextField } from '@/components/auth/TextField';
import { completeInitialSetup, getInitialSetupInfo } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';
import type { MemberDetail, MemberSummary } from '@/lib/api/types';
import { clearPendingSetup, getPendingSetup } from '@/lib/auth/pending-session';
import { setSession } from '@/lib/auth/session-store';
import { formatPhoneNumber, mapCaretToFormatted } from '@/lib/format-phone';
import { MEMBER_TYPE_LABELS, TRACK_LABELS } from '@/lib/member-labels';

export default function InitialSetupPage() {
  const router = useRouter();
  const [accessToken] = useState(() => getPendingSetup()?.accessToken ?? null);
  const [info] = useState<MemberSummary | null>(() => getPendingSetup()?.member ?? null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [github, setGithub] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
      return;
    }

    getInitialSetupInfo(accessToken)
      .then((fetched: MemberDetail) => {
        setPhone(fetched.phoneNumber ? formatPhoneNumber(fetched.phoneNumber) : '');
        setEmail(fetched.email ?? '');
        setGithub(fetched.githubId ?? '');
        setDetail(fetched);
      })
      .catch((err) => {
        setLoadError(err instanceof ApiError ? err.message : '정보를 불러오지 못했습니다.');
      });
  }, [accessToken, router]);

  const requiredFilled = phone.trim() && email.trim() && newPassword.trim() && newPasswordConfirm.trim();

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

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!accessToken || !requiredFilled) {
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const response = await completeInitialSetup(accessToken, {
        phoneNumber: phone,
        email,
        githubId: github,
        newPassword,
        newPasswordConfirm,
      });
      clearPendingSetup();
      setSession({ accessToken: response.accessToken, member: response.member });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!info || (!detail && !loadError)) {
    return (
      <AuthCard width={560} className="px-[52px] py-12">
        <p className="text-center text-[13.5px] text-white/50">불러오는 중...</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard width={560} className="px-[52px] py-12">
      {loadError ? (
        <div className="flex flex-col items-center py-10 text-center">
          <LogoBadge size={84} />
          <div className="mb-2.5 text-[19px] font-bold text-white">정보를 불러오지 못했어요</div>
          <div className="mb-7 text-[13.5px] leading-[1.6] text-white/50">{loadError}</div>
          <Link href="/login" className="text-[13px] font-semibold text-[var(--accent)] hover:underline">
            로그인 화면으로
          </Link>
        </div>
      ) : saved ? (
        <div className="flex flex-col items-center py-10 text-center">
          <LogoBadge size={84} />
          <div className="mb-2.5 text-[19px] font-bold text-white">설정이 완료됐어요</div>
          <div className="mb-7 text-[13.5px] text-white/50">이제부터 학번과 새 비밀번호로 로그인할 수 있어요.</div>
          <Link href="/" className="text-[13px] font-semibold text-[var(--accent)] hover:underline">
            시작하기
          </Link>
        </div>
      ) : (
        <div>
          <div className="mb-1 text-[20px] font-bold text-white">첫 로그인이시네요</div>
          <div className="mb-[26px] text-[13px] leading-[1.6] text-white/50">
            관리자가 등록한 정보를 확인하고, 연락처와 비밀번호를 설정해주세요.
          </div>

          <div className="mb-3.5 border-b border-white/10 pb-2 text-[11px] font-semibold tracking-[.04em] text-white/35 uppercase">
            관리자 등록 정보 (읽기 전용)
          </div>
          <div className="mb-7 grid grid-cols-2 gap-x-4 gap-y-2.5">
            <ReadOnlyField label="이름" value={info.name} />
            <ReadOnlyField label="학번" value={info.studentNumber} />
            <ReadOnlyField label="트랙" value={TRACK_LABELS[info.track]} />
            <ReadOnlyField label="기수" value={info.generation} />
            <ReadOnlyField label="구분" value={MEMBER_TYPE_LABELS[info.memberType]} />
            <ReadOnlyField label="소속" value={info.university} />
          </div>

          <div className="mb-4 border-b border-white/10 pb-2 text-[11px] font-semibold tracking-[.04em] text-white/35 uppercase">
            본인이 입력/수정
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div className="grid grid-cols-2 gap-4">
              <TextField
                ref={phoneInputRef}
                label="전화번호"
                type="tel"
                placeholder="010-0000-0000"
                value={phone}
                onChange={handlePhoneChange}
                compact
                required
              />
              <TextField
                label="이메일"
                type="email"
                placeholder="mail@bcsdlab.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                compact
                required
              />
            </div>
            <TextField
              label="깃허브 아이디"
              type="text"
              placeholder="아이디만 입력 (예: bcsdlab)"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              compact
            />
            <TextField
              label="새 비밀번호"
              type="password"
              placeholder="8자 이상, 영문+숫자"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              compact
              required
            />
            <TextField
              label="새 비밀번호 확인"
              type="password"
              placeholder="새 비밀번호를 다시 입력해주세요"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              compact
              required
            />

            {error && <p className="text-[13px] text-red-400">{error}</p>}

            <PrimaryButton type="submit" disabled={!requiredFilled || submitting} className="mt-2.5">
              {submitting ? '저장 중...' : '저장하고 시작하기'}
            </PrimaryButton>
          </form>
        </div>
      )}
    </AuthCard>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#0d0f22] px-3.5 py-2.5">
      <div className="mb-[3px] text-[11px] text-white/40">{label}</div>
      <div className="text-[13.5px] font-semibold text-white">{value}</div>
    </div>
  );
}

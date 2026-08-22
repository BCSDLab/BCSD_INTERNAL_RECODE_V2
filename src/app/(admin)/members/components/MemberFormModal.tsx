'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { MemberType, Track } from '@/api/auth/types';
import { ApiError } from '@/api/client';
import { createMember, updateMemberProfile } from '@/api/member/api';
import { memberKeys } from '@/api/member/queries';
import type { AcademicStatus, MemberDirectoryItem } from '@/api/member/types';
import { Button } from '@/components/ui/button';
import { Field, INPUT_CLASS_COMPACT } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { ACADEMIC_STATUS_LABELS, MEMBER_TYPE_LABELS, TRACK_LABELS } from '@/lib/member-labels';
import {
  ACADEMIC_STATUS_OPTIONS,
  DEFAULT_DEPARTMENT,
  DEFAULT_UNIVERSITY,
  DEPARTMENT_OPTIONS,
  MEMBER_TYPE_OPTIONS,
  POSITION_OPTIONS,
  TRACK_OPTIONS,
} from './options';

interface FormValues {
  name: string;
  studentNumber: string;
  track: Track;
  memberType: MemberType;
  generation: string;
  university: string;
  department: string;
  academicStatus: AcademicStatus;
  active: boolean;
  position: string;
  birthDate: string;
  duesRequired: boolean;
  email: string;
  phoneNumber: string;
  githubId: string;
}

function toForm(member: MemberDirectoryItem | null): FormValues {
  return {
    name: member?.name ?? '',
    studentNumber: member?.studentNumber ?? '',
    track: member?.track ?? 'FRONTEND',
    memberType: member?.memberType ?? 'BEGINNER',
    generation: member?.generation ?? '',
    university: member?.university ?? DEFAULT_UNIVERSITY,
    department: member?.department ?? DEFAULT_DEPARTMENT,
    academicStatus: member?.academicStatus ?? 'ENROLLED',
    active: member?.active ?? true,
    position: member?.position ?? '',
    birthDate: member?.birthDate ?? '',
    duesRequired: member?.duesRequired ?? true,
    email: member?.email ?? '',
    phoneNumber: member?.phoneNumber ?? '',
    githubId: member?.githubId ?? '',
  };
}

const STUDENT_NUMBER_PATTERN = /^\d{8,10}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BIRTH_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** 서버 검증(@NotBlank·@Pattern·@Email)과 같은 조건을 먼저 확인해 왕복을 줄인다. */
function validate(values: FormValues, isNew: boolean): Partial<Record<keyof FormValues, string>> {
  const errors: Partial<Record<keyof FormValues, string>> = {};
  if (!values.name.trim()) {
    errors.name = '필수 항목입니다.';
  }
  if (!values.generation.trim()) {
    errors.generation = '필수 항목입니다.';
  }
  if (!values.university.trim()) {
    errors.university = '필수 항목입니다.';
  }
  if (!values.department.trim()) {
    errors.department = '필수 항목입니다.';
  }
  if (!values.email.trim()) {
    errors.email = '필수 항목입니다.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = '이메일 형식이 올바르지 않습니다.';
  }
  if (isNew) {
    if (!values.studentNumber.trim()) {
      errors.studentNumber = '필수 항목입니다.';
    } else if (!STUDENT_NUMBER_PATTERN.test(values.studentNumber.trim())) {
      errors.studentNumber = '학번은 숫자 8~10자리여야 합니다.';
    }
  }
  if (!isNew && values.birthDate.trim() && !BIRTH_DATE_PATTERN.test(values.birthDate.trim())) {
    errors.birthDate = 'yyyy-mm-dd 형식으로 입력해 주세요.';
  }
  return errors;
}

function optional(value: string): string | null {
  return value.trim() || null;
}

/**
 * 부원 추가·수정 모달.
 *
 * 추가와 수정이 다루는 필드가 다르다 — POST는 학번·학적상태·활동 여부를 받지만 보직·생일·납부는
 * 받지 않고, PATCH 프로필은 그 반대다. 그래서 만들 때 안 되는 필드를 보이지 않게 나눠 놓았다.
 * (구 구현은 추가 시 POST 뒤에 PATCH를 한 번 더 보내 두 요청이 갈라질 수 있었다.)
 * 수정에서 학번·학적상태·활동 여부를 아예 보이지 않는 것도 같은 이유다 — PATCH 프로필이
 * 받지 않는 값이라 넣어도 조용히 버려진다. 각각 전용 흐름(학적 상태 · 활동 토글)으로 바꾼다.
 */
export function MemberFormModal({
  member,
  onClose,
}: {
  member: MemberDirectoryItem | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isNew = member === null;

  const [form, setForm] = useState<FormValues>(() => toForm(member));
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [error, setError] = useState<string | null>(null);

  function update(patch: Partial<FormValues>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  const mutation = useMutation({
    mutationFn: () => {
      if (isNew) {
        return createMember({
          name: form.name.trim(),
          studentNumber: form.studentNumber.trim(),
          track: form.track,
          memberType: form.memberType,
          generation: form.generation.trim(),
          university: form.university.trim(),
          department: form.department.trim(),
          academicStatus: form.academicStatus,
          active: form.active,
          email: form.email.trim(),
          phoneNumber: form.phoneNumber.trim() || undefined,
          githubId: form.githubId.trim() || undefined,
        }).then(() => undefined);
      }
      return updateMemberProfile(member.id, {
        name: form.name.trim(),
        track: form.track,
        memberType: form.memberType,
        generation: form.generation.trim(),
        university: form.university.trim(),
        department: form.department.trim(),
        position: optional(form.position),
        birthDate: optional(form.birthDate),
        duesRequired: form.duesRequired,
        email: form.email.trim(),
        phoneNumber: optional(form.phoneNumber),
        githubId: optional(form.githubId.replace(/^@/, '')),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all() });
      onClose();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : '저장에 실패했습니다.'),
  });

  function handleSubmit() {
    const nextErrors = validate(form, isNew);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError('입력값을 확인해 주세요.');
      return;
    }
    setError(null);
    mutation.mutate();
  }

  return (
    <Modal
      eyebrow={isNew ? '인명부 · 부원 추가' : '인명부 · 부원 수정'}
      title={form.name || '새 부원'}
      onClose={onClose}
      width="720px"
      footer={
        <>
          <span className="text-faint text-[11px] whitespace-nowrap">
            {isNew ? '가입 안내 메일이 발송됩니다' : '학번 · 학적 상태 · 활동 여부는 목록에서 바꿉니다'}
          </span>
          <Button onClick={onClose} className="ml-auto px-4 py-2.5">
            취소
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={mutation.isPending} className="px-[18px] py-2.5">
            저장
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3.5 px-6 py-5">
        <FormField label="이름 *" error={errors.name}>
          <input
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="홍길동"
            className={INPUT_CLASS_COMPACT}
          />
        </FormField>

        <FormField label="기수 *" error={errors.generation}>
          <input
            value={form.generation}
            onChange={(e) => update({ generation: e.target.value })}
            placeholder="예: 24-상"
            className={INPUT_CLASS_COMPACT}
          />
        </FormField>

        {isNew && (
          <FormField label="학번 *" error={errors.studentNumber} hint="숫자 8~10자리 · 추가할 때만 정할 수 있습니다">
            <input
              value={form.studentNumber}
              onChange={(e) => update({ studentNumber: e.target.value })}
              placeholder="2024136000"
              className={INPUT_CLASS_COMPACT}
            />
          </FormField>
        )}

        <FormField label="트랙 *">
          <select
            value={form.track}
            onChange={(e) => update({ track: e.target.value as Track })}
            className={INPUT_CLASS_COMPACT}
          >
            {TRACK_OPTIONS.map((track) => (
              <option key={track} value={track}>
                {TRACK_LABELS[track]}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="구분 *">
          <select
            value={form.memberType}
            onChange={(e) => update({ memberType: e.target.value as MemberType })}
            className={INPUT_CLASS_COMPACT}
          >
            {MEMBER_TYPE_OPTIONS.map((memberType) => (
              <option key={memberType} value={memberType}>
                {MEMBER_TYPE_LABELS[memberType]}
              </option>
            ))}
          </select>
        </FormField>

        {isNew && (
          <FormField label="학적 상태 *">
            <select
              value={form.academicStatus}
              onChange={(e) => update({ academicStatus: e.target.value as AcademicStatus })}
              className={INPUT_CLASS_COMPACT}
            >
              {ACADEMIC_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {ACADEMIC_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <FormField label="소속 *" error={errors.university}>
          <input
            value={form.university}
            onChange={(e) => update({ university: e.target.value })}
            className={INPUT_CLASS_COMPACT}
          />
        </FormField>

        <FormField label="학부(학과) *" error={errors.department}>
          <select
            value={form.department}
            onChange={(e) => update({ department: e.target.value })}
            className={INPUT_CLASS_COMPACT}
          >
            {DEPARTMENT_OPTIONS.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="이메일(Google) *" error={errors.email}>
          <input
            value={form.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="name@gmail.com"
            className={INPUT_CLASS_COMPACT}
          />
        </FormField>

        <FormField label="전화번호">
          <input
            value={form.phoneNumber}
            onChange={(e) => update({ phoneNumber: e.target.value })}
            placeholder="010-0000-0000"
            className={INPUT_CLASS_COMPACT}
          />
        </FormField>

        <FormField label="Github User name">
          <input
            value={form.githubId}
            onChange={(e) => update({ githubId: e.target.value })}
            placeholder="username"
            className={INPUT_CLASS_COMPACT}
          />
        </FormField>

        {!isNew && (
          <>
            <FormField label="보직">
              <select
                value={form.position}
                onChange={(e) => update({ position: e.target.value })}
                className={INPUT_CLASS_COMPACT}
              >
                <option value="">— 없음</option>
                {POSITION_OPTIONS.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="생일" error={errors.birthDate}>
              <input
                value={form.birthDate}
                onChange={(e) => update({ birthDate: e.target.value })}
                placeholder="yyyy-mm-dd"
                className={INPUT_CLASS_COMPACT}
              />
            </FormField>

            <FormField label="납부 대상">
              <select
                value={form.duesRequired ? 'O' : 'X'}
                onChange={(e) => update({ duesRequired: e.target.value === 'O' })}
                className={INPUT_CLASS_COMPACT}
              >
                <option value="O">O · 납부 대상</option>
                <option value="X">X · 대상 아님</option>
              </select>
            </FormField>
          </>
        )}

        {isNew && (
          <FormField label="활동 여부">
            <select
              value={form.active ? 'true' : 'false'}
              onChange={(e) => update({ active: e.target.value === 'true' })}
              className={INPUT_CLASS_COMPACT}
            >
              <option value="true">활동으로 등록</option>
              <option value="false">비활동으로 등록</option>
            </select>
          </FormField>
        )}

        {error && <p className="text-danger col-span-2 m-0 text-[11px]">{error}</p>}
      </div>
    </Modal>
  );
}

function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Field label={label} hint={error ? undefined : hint}>
      {children}
      {error && <span className="text-danger text-[11px]">{error}</span>}
    </Field>
  );
}

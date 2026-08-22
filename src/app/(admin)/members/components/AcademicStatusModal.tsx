'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError } from '@/api/client';
import { updateMemberAcademicStatus } from '@/api/member/api';
import { memberKeys } from '@/api/member/queries';
import type { AcademicStatus, MemberDirectoryItem } from '@/api/member/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ACADEMIC_STATUS_LABELS } from '@/lib/member-labels';
import { ACADEMIC_STATUS_OPTIONS } from './options';
import { OptionRow } from './OptionRow';

export function AcademicStatusModal({ member, onClose }: { member: MemberDirectoryItem; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AcademicStatus>(member.academicStatus);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => updateMemberAcademicStatus(member.id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all() });
      onClose();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : '학적 상태 변경에 실패했습니다.'),
  });

  return (
    <Modal
      eyebrow={`${member.name} · ${member.generation}`}
      title="학적 상태"
      onClose={onClose}
      width="360px"
      footer={
        <>
          <Button onClick={onClose} className="ml-auto px-4 py-2.5">
            취소
          </Button>
          <Button
            variant="primary"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || status === member.academicStatus}
            className="px-[18px] py-2.5"
          >
            적용
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2 px-6 py-5">
        {ACADEMIC_STATUS_OPTIONS.map((option) => (
          <OptionRow
            key={option}
            label={ACADEMIC_STATUS_LABELS[option]}
            selected={status === option}
            onSelect={() => setStatus(option)}
          />
        ))}
        <p className="text-faint m-0 text-[11px] leading-[1.65]">활동 여부는 함께 바뀌지 않습니다.</p>
        {error && <p className="text-danger m-0 text-[11px]">{error}</p>}
      </div>
    </Modal>
  );
}

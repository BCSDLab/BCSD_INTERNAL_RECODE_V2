'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { MemberRole } from '@/api/auth/types';
import { ApiError } from '@/api/client';
import { updateMemberRole } from '@/api/member/api';
import { memberKeys } from '@/api/member/queries';
import type { MemberDirectoryItem } from '@/api/member/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { MEMBER_TYPE_LABELS } from '@/lib/member-labels';
import { OptionRow } from './OptionRow';

const ROLE_DESCRIPTIONS: Record<MemberRole, { title: string; description: string }> = {
  MEMBER: {
    title: '일반 · 조회만 가능',
    description: '인명부를 볼 수 있습니다. 부원 정보 변경은 할 수 없습니다.',
  },
  ADMIN: {
    title: '관리자 · 추가·수정·탈퇴까지 가능',
    description: '부원 추가와 탈퇴를 포함해 인명부 전체를 관리합니다.',
  },
};

export function MemberRoleModal({ member, onClose }: { member: MemberDirectoryItem; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<MemberRole>(member.role);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => updateMemberRole(member.id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all() });
      onClose();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : '권한 변경에 실패했습니다.'),
  });

  return (
    <Modal
      eyebrow={`${member.name} · ${MEMBER_TYPE_LABELS[member.memberType]}`}
      title="권한 변경"
      onClose={onClose}
      width="420px"
      footer={
        <>
          <Button onClick={onClose} className="ml-auto px-4 py-2.5">
            취소
          </Button>
          <Button
            variant="primary"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || role === member.role}
            className="px-[18px] py-2.5"
          >
            적용
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-2 px-6 py-5">
        {(['MEMBER', 'ADMIN'] as const).map((value) => (
          <OptionRow
            key={value}
            label={ROLE_DESCRIPTIONS[value].title}
            description={ROLE_DESCRIPTIONS[value].description}
            selected={role === value}
            onSelect={() => setRole(value)}
          />
        ))}

        <p className="border-dash text-faint m-0 rounded-[10px] border border-dashed px-3 py-2.5 text-[11px] leading-[1.65]">
          구분(비기너 · 레귤러 · 멘토)과는 별개로 부여합니다.
        </p>

        {error && <p className="text-danger m-0 text-[11px]">{error}</p>}
      </div>
    </Modal>
  );
}

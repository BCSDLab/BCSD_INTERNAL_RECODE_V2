'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError } from '@/api/client';
import { updateMemberActive, updateMemberWithdrawal } from '@/api/member/api';
import { memberKeys } from '@/api/member/queries';
import type { MemberDirectoryItem } from '@/api/member/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

/**
 * 탈퇴 / 복구.
 *
 * 백엔드 withdraw()는 계정 상태(status)만 WITHDRAWN으로 바꾼다 — 활동 여부(active)는 건드리지
 * 않고, 인명부 응답에도 status가 없다. 즉 지금 이 부원이 탈퇴 상태인지 화면에서는 알 수 없다.
 * 그래서 현재 상태를 추측해 보이는 대신, 탈퇴와 복구를 각각 명시적인 버튼으로 둔다.
 */
export function MemberWithdrawalModal({ member, onClose }: { member: MemberDirectoryItem; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  function handleError(e: unknown) {
    setError(e instanceof ApiError ? e.message : '처리에 실패했습니다.');
  }
  function handleSuccess() {
    queryClient.invalidateQueries({ queryKey: memberKeys.all() });
    onClose();
  }

  const withdrawMutation = useMutation({
    mutationFn: (withdrawn: boolean) => updateMemberWithdrawal(member.id, withdrawn),
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const deactivateMutation = useMutation({
    mutationFn: () => updateMemberActive(member.id, false),
    onSuccess: handleSuccess,
    onError: handleError,
  });

  const isPending = withdrawMutation.isPending || deactivateMutation.isPending;

  return (
    <Modal
      eyebrow="인명부"
      title="탈퇴 처리"
      onClose={onClose}
      width="440px"
      footer={
        <>
          <Button onClick={onClose} className="ml-auto px-4 py-2.5">
            취소
          </Button>
          <Button
            variant="dangerOutline"
            onClick={() => withdrawMutation.mutate(true)}
            disabled={isPending}
            className="px-4 py-2.5"
          >
            탈퇴 처리
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5 px-6 py-5">
        <div className="border-line bg-panel2 flex flex-col gap-1.5 rounded-[12px] border px-3.5 py-3">
          <span className="text-[13px] font-medium">
            {member.name} · {member.studentNumber} · {member.generation}
          </span>
          <span className="text-muted text-[11px] leading-[1.65]">
            계정이 탈퇴 상태가 되어 로그인할 수 없게 됩니다. 인명부에서 줄이 사라지지는 않습니다.
          </span>
        </div>

        <div className="border-dash flex flex-col gap-2 rounded-[12px] border border-dashed px-3.5 py-3">
          <span className="text-faint text-[11px] leading-[1.65]">
            활동만 중단하려면 탈퇴가 아니라 비활동으로 바꾸세요. 이미 탈퇴한 계정은 복구할 수 있습니다.
          </span>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => deactivateMutation.mutate()} disabled={isPending}>
              비활동으로 변경
            </Button>
            <Button onClick={() => withdrawMutation.mutate(false)} disabled={isPending}>
              탈퇴 복구
            </Button>
          </div>
        </div>

        {error && <p className="text-danger m-0 text-[11px]">{error}</p>}
      </div>
    </Modal>
  );
}

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError } from '@/api/client';
import { lookupSlackIds, updateMemberSlackIds } from '@/api/dues/api';
import { invalidateLedgerAndDues } from '@/api/dues/queries';
import { memberKeys } from '@/api/member/queries';
import type { MemberDues } from '@/components/dues/types';
import { Button } from '@/components/ui/button';
import { INPUT_CLASS_COMPACT } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { normalizeSlackId, slackIdError, toSlackIdInput } from '@/lib/slack-id';

/**
 * Slack 알림 대상 중 인명부 Slack ID가 비어 있는 회원을 채우는 모달.
 * - 직접 입력: 저장을 눌러야 인명부에 반영된다.
 * - 자동 채우기: 서버가 회원 이메일로 Slack을 조회해(findSlackIdByEmail) 찾은 값을 **바로** 인명부에
 *   저장하고, 입력칸에도 채운다.
 * 목록은 연 시점의 누락 회원으로 고정한다 — 저장 중 값이 채워져도 행이 사라지지 않게.
 */
export function SlackIdInputModal({ members, onClose }: { members: MemberDues[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [rows] = useState(members);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notFoundIds, setNotFoundIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const errors = Object.fromEntries(
    rows.flatMap((member) => {
      const rowError = slackIdError(values[member.id] ?? '');
      return rowError ? [[member.id, rowError]] : [];
    }),
  );
  const hasErrors = Object.keys(errors).length > 0;

  async function refreshAfterSave() {
    // 회비 학기(알림 모달의 "Slack 계정 확인")와 인명부 목록이 같은 값을 보여 주도록 둘 다 다시 받는다.
    await Promise.all([
      invalidateLedgerAndDues(queryClient),
      queryClient.invalidateQueries({ queryKey: memberKeys.all() }),
    ]);
  }

  const autoFill = useMutation({
    onMutate: () => setError(''),
    mutationFn: () => {
      const memberIds = rows
        .filter((member) => !normalizeSlackId(values[member.id] ?? ''))
        .map((member) => Number(member.id));
      return lookupSlackIds({ memberIds });
    },
    onSuccess: async ({ results }) => {
      const found = results.filter((result) => result.slackId);
      const missed = results.filter((result) => !result.slackId).map((result) => String(result.memberId));
      setValues((current) => ({
        ...current,
        ...Object.fromEntries(found.map((result) => [String(result.memberId), result.slackId!])),
      }));
      // 결과는 행마다 보인다 — 찾은 회원은 입력칸이 채워지고, 못 찾은 회원은 "Slack에서 찾지 못했습니다."
      setNotFoundIds(missed);
      await refreshAfterSave();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Slack 자동 조회에 실패했습니다.'),
  });

  const save = useMutation({
    onMutate: () => setError(''),
    mutationFn: () =>
      updateMemberSlackIds(
        rows.flatMap((member) => {
          const slackId = normalizeSlackId(values[member.id] ?? '');
          return slackId ? [{ memberId: Number(member.id), slackId }] : [];
        }),
      ),
    onSuccess: async () => {
      await refreshAfterSave();
      onClose();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Slack ID를 저장하지 못했습니다.'),
  });

  const isBusy = autoFill.isPending || save.isPending;
  const emptyCount = rows.filter((member) => !normalizeSlackId(values[member.id] ?? '')).length;

  return (
    <Modal
      title="Slack ID 입력"
      onClose={isBusy ? () => undefined : onClose}
      width="640px"
      footer={
        <>
          <Button disabled={isBusy || emptyCount === 0} onClick={() => autoFill.mutate()}>
            {autoFill.isPending ? '조회 중…' : '자동 채우기'}
          </Button>
          <Button className="ml-auto" disabled={isBusy} onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" disabled={isBusy || hasErrors} onClick={() => save.mutate()}>
            저장
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 px-6 py-5">
        <p className="text-muted text-xs leading-5">
          Slack ID가 없는 회원에게는 알림을 보낼 수 없습니다. 직접 입력하거나 자동 채우기로 회원 이메일의 Slack 계정을
          찾으세요. 입력한 값은 인명부에 저장됩니다.
        </p>
        {error && <p className="text-danger text-xs font-semibold">{error}</p>}
        <div className="border-line overflow-hidden rounded-[12px] border">
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[22%]" />
              <col className="w-[16%]" />
              <col className="w-[40%]" />
            </colgroup>
            <thead className="bg-panel2 text-faint text-[11px] font-bold">
              <tr className="border-line border-b">
                <th className="px-4 py-2.5">이름</th>
                <th className="px-4 py-2.5">학번</th>
                <th className="px-4 py-2.5">트랙</th>
                <th className="px-4 py-2.5">Slack ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((member) => (
                <tr key={member.id} className="border-line border-b text-xs last:border-b-0">
                  <td className="px-4 py-2.5 font-semibold">{member.name}</td>
                  <td className="text-muted px-4 py-2.5 tabular-nums">{member.studentNumber}</td>
                  <td className="text-muted px-4 py-2.5">{member.track}</td>
                  <td className="px-4 py-2">
                    <input
                      aria-label={`${member.name} Slack ID`}
                      value={values[member.id] ?? ''}
                      disabled={isBusy}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [member.id]: toSlackIdInput(event.target.value) }))
                      }
                      placeholder="U0123ABCDE"
                      className={INPUT_CLASS_COMPACT}
                    />
                    {errors[member.id] ? (
                      <span className="text-danger mt-1 block text-[11px]">{errors[member.id]}</span>
                    ) : (
                      notFoundIds.includes(member.id) &&
                      !normalizeSlackId(values[member.id] ?? '') && (
                        <span className="text-danger mt-1 block text-[11px]">Slack에서 찾지 못했습니다.</span>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

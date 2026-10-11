'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError } from '@/api/client';
import { lookupSlackIds, updateMemberSlackIds } from '@/api/dues/api';
import { invalidateLedgerAndDues } from '@/api/dues/queries';
import type { SlackIdLookupResult } from '@/api/member/api';
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
 *   저장하고(SAVED), 입력칸에도 채운다. 못 찾음·중복·실패는 행마다 문구로 보인다.
 * - 저장은 행마다 따로 성공·실패한다. 실패한 행(예: 409 중복)은 서버 메시지를 보이고 모달을 닫지 않는다.
 * 목록은 연 시점의 누락 회원으로 고정한다 — 저장 중 값이 채워져도 행이 사라지지 않게.
 */
function lookupMessage(result: SlackIdLookupResult) {
  switch (result.status) {
    case 'SAVED':
      return null;
    case 'NOT_FOUND':
      return 'Slack에서 찾지 못했습니다.';
    case 'DUPLICATED':
      return `이미 ${result.ownerName ?? '다른'} 회원이 사용 중입니다.`;
    case 'FAILED':
      return 'Slack 조회에 실패했습니다.';
    case 'MEMBER_NOT_FOUND':
      return '회원을 찾을 수 없습니다.';
  }
}

export function SlackIdInputModal({ members, onClose }: { members: MemberDues[]; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [rows] = useState(members);
  const [values, setValues] = useState<Record<string, string>>({});
  /** 자동 채우기 결과 문구(SAVED 제외). 입력칸이 비어 있을 때만 보인다. */
  const [lookupMessages, setLookupMessages] = useState<Record<string, string>>({});
  /** 저장 실패한 행의 서버 메시지. */
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
  /** 인명부에 이미 저장된 행(자동 채우기 SAVED 또는 저장 성공). 다시 보내지 않는다. */
  const [savedIds, setSavedIds] = useState<string[]>([]);
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
      const saved = results.filter((result) => result.status === 'SAVED' && result.slackId);
      setValues((current) => ({
        ...current,
        ...Object.fromEntries(saved.map((result) => [String(result.memberId), result.slackId!])),
      }));
      setSavedIds((current) => [...new Set([...current, ...saved.map((result) => String(result.memberId))])]);
      // 결과는 행마다 보인다 — 저장된 회원은 입력칸이 채워지고, 나머지는 status별 문구가 나온다.
      setLookupMessages((current) => {
        const next = { ...current };
        for (const result of results) {
          const message = lookupMessage(result);
          if (message) next[String(result.memberId)] = message;
          else delete next[String(result.memberId)];
        }
        return next;
      });
      await refreshAfterSave();
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Slack 자동 조회에 실패했습니다.'),
  });

  const save = useMutation({
    onMutate: () => setError(''),
    mutationFn: async () => {
      const updates = rows.flatMap((member) => {
        const slackId = normalizeSlackId(values[member.id] ?? '');
        return slackId && !savedIds.includes(member.id) ? [{ memberId: Number(member.id), slackId }] : [];
      });
      const results = await updateMemberSlackIds(updates);
      return updates.map((update, index) => ({ memberId: String(update.memberId), result: results[index] }));
    },
    onSuccess: async (outcomes) => {
      const succeeded = outcomes.filter(({ result }) => result.status === 'fulfilled').map(({ memberId }) => memberId);
      const failed = outcomes.flatMap(({ memberId, result }) =>
        result.status === 'rejected'
          ? [
              [
                memberId,
                result.reason instanceof ApiError ? result.reason.message : 'Slack ID를 저장하지 못했습니다.',
              ] as const,
            ]
          : [],
      );
      setSavedIds((current) => [...new Set([...current, ...succeeded])]);
      setSaveErrors(Object.fromEntries(failed));
      await refreshAfterSave();
      if (failed.length === 0) onClose();
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
              {rows.map((member) => {
                const isSaved = savedIds.includes(member.id);
                const isEmpty = !normalizeSlackId(values[member.id] ?? '');
                const rowMessage =
                  errors[member.id] ?? saveErrors[member.id] ?? (isEmpty ? lookupMessages[member.id] : undefined);
                return (
                  <tr key={member.id} className="border-line border-b text-xs last:border-b-0">
                    <td className="px-4 py-2.5 font-semibold">{member.name}</td>
                    <td className="text-muted px-4 py-2.5 tabular-nums">{member.studentNumber}</td>
                    <td className="text-muted px-4 py-2.5">{member.track}</td>
                    <td className="px-4 py-2">
                      <input
                        aria-label={`${member.name} Slack ID`}
                        value={values[member.id] ?? ''}
                        disabled={isBusy || isSaved}
                        onChange={(event) => {
                          setValues((current) => ({ ...current, [member.id]: toSlackIdInput(event.target.value) }));
                          setSaveErrors((current) => {
                            const next = { ...current };
                            delete next[member.id];
                            return next;
                          });
                        }}
                        placeholder="U0123ABCDE"
                        className={INPUT_CLASS_COMPACT}
                      />
                      {rowMessage ? (
                        <span role="alert" className="text-danger mt-1 block text-[11px]">
                          {rowMessage}
                        </span>
                      ) : (
                        isSaved && <span className="text-success mt-1 block text-[11px]">인명부에 저장됨</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

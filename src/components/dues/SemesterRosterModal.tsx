'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ApiError } from '@/api/client';
import { addRosterMember, updateRosterMember } from '@/api/dues/api';
import { duesQueries, invalidateLedgerAndDues } from '@/api/dues/queries';
import type { RosterMember, SemesterDuesSummary } from '@/components/dues/types';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

const EMPTY_ROSTER: RosterMember[] = [];

function ApplicableSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-none cursor-pointer items-center rounded-full border transition-colors ${
        checked ? 'border-primary bg-primary' : 'border-line2 bg-panel2'
      }`}
    >
      <span
        aria-hidden="true"
        className={`bg-panel absolute h-3.5 w-3.5 rounded-full shadow-sm transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-[2px]'
        }`}
      />
    </button>
  );
}

/**
 * 학기 명단 추가·정정. 납부 대상 토글과 회원 추가를 모아 두었다가 저장할 때 한 번에 보낸다.
 * 저장하면 학기 회비를 다시 받는다(명단이 부과액·집계를 바꾼다).
 */
export function SemesterRosterModal({
  semester,
  onClose,
  onSaved,
}: {
  semester: SemesterDuesSummary;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const { data: roster = EMPTY_ROSTER, isPending, isError } = useQuery(duesQueries.roster(semester.id));
  const { data: candidates = EMPTY_ROSTER } = useQuery(duesQueries.rosterCandidates(semester.id));
  const [toggles, setToggles] = useState<Record<string, boolean>>({});
  const [additions, setAdditions] = useState<RosterMember[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [query, setQuery] = useState('');
  const [newApplicable, setNewApplicable] = useState(true);
  const [error, setError] = useState('');

  const changedMembers = roster.filter(
    (member) => toggles[member.id] !== undefined && toggles[member.id] !== member.applicable,
  );
  const changeCount = changedMembers.length + additions.length;
  const addedIds = useMemo(() => new Set(additions.map((member) => member.id)), [additions]);
  const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
  const visibleCandidates = candidates.filter(
    (member) =>
      !addedIds.has(member.id) &&
      (normalizedQuery === '' ||
        `${member.name} ${member.studentNumber} ${member.track}`.toLocaleLowerCase('ko-KR').includes(normalizedQuery)),
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const member of changedMembers) {
        await updateRosterMember(semester.id, Number(member.id), { applicable: toggles[member.id] });
      }
      for (const member of additions) {
        await addRosterMember(semester.id, { memberId: Number(member.id), applicable: member.applicable });
      }
    },
    onSuccess: async () => {
      await invalidateLedgerAndDues(queryClient);
      onSaved(`${semester.title} 명단을 저장했습니다.`);
    },
    onError: async (e) => {
      // 일부만 반영됐을 수 있으니 서버 명단을 다시 받는다.
      await invalidateLedgerAndDues(queryClient);
      setToggles({});
      setAdditions([]);
      setError(e instanceof ApiError ? e.message : '명단을 저장하지 못했습니다.');
    },
  });

  function addMember(member: RosterMember) {
    setAdditions((current) => [...current, { ...member, applicable: newApplicable }]);
    setError('');
  }

  function save() {
    if (changeCount === 0 || saveMutation.isPending) return;
    setError('');
    saveMutation.mutate();
  }

  const rows = [
    ...roster.map((member) => ({ member, isNew: false, applicable: toggles[member.id] ?? member.applicable })),
    ...additions.map((member) => ({ member, isNew: true, applicable: member.applicable })),
  ];

  return (
    <Modal
      eyebrow={semester.title}
      title="명단 관리"
      onClose={onClose}
      width="720px"
      footer={
        <>
          {error ? (
            <span role="alert" className="text-danger text-xs">
              {error}
            </span>
          ) : (
            <span className="text-faint text-[11px]">
              {changeCount > 0 ? `변경 ${changeCount}건 · 저장하면 학기 회비를 다시 계산합니다.` : '변경 없음'}
            </span>
          )}
          <Button className="ml-auto" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" disabled={changeCount === 0 || saveMutation.isPending} onClick={save}>
            저장
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 px-6 py-5">
        {isError ? (
          <p className="text-muted py-8 text-center text-[13px]">명단을 불러오지 못했습니다.</p>
        ) : isPending ? (
          <p className="text-muted py-8 text-center text-[13px]">불러오는 중…</p>
        ) : (
          <div className="border-line max-h-[340px] overflow-y-auto rounded-[12px] border">
            <table className="w-full border-collapse text-left">
              <thead className="bg-panel2 text-faint sticky top-0 text-[11px] font-bold">
                <tr className="border-line border-b">
                  <th className="px-4 py-2.5">이름</th>
                  <th className="px-4 py-2.5">학번</th>
                  <th className="px-4 py-2.5">트랙</th>
                  <th className="px-4 py-2.5 text-center">납부 대상</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ member, isNew, applicable }) => (
                  <tr key={member.id} className="border-line border-b text-xs last:border-b-0">
                    <td className="px-4 py-2.5 font-semibold whitespace-nowrap">
                      {member.name}
                      {isNew && (
                        <span className="border-primary-line bg-primary-soft text-primary-text ml-2 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold">
                          추가 예정
                        </span>
                      )}
                    </td>
                    <td className="text-muted px-4 py-2.5">{member.studentNumber}</td>
                    <td className="text-muted px-4 py-2.5">{member.track}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-2">
                        <ApplicableSwitch
                          label={`${member.name} 납부 대상`}
                          checked={applicable}
                          onChange={(checked) => {
                            setError('');
                            if (isNew) {
                              setAdditions((current) =>
                                current.map((item) =>
                                  item.id === member.id ? { ...item, applicable: checked } : item,
                                ),
                              );
                            } else {
                              setToggles((current) => ({ ...current, [member.id]: checked }));
                            }
                          }}
                        />
                        <span className={`w-[38px] text-[11px] ${applicable ? 'text-text' : 'text-faint'}`}>
                          {applicable ? '대상' : '비대상'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isAdding ? (
          <div className="border-line bg-panel2 flex flex-col gap-3 rounded-[12px] border p-4">
            <div className="flex items-center gap-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="이름·학번·트랙 검색"
                aria-label="추가할 회원 검색"
                autoFocus
                className="border-line2 bg-panel focus:border-primary-line h-9 min-w-0 flex-1 rounded-[8px] border px-2.5 text-xs outline-none"
              />
              <label className="text-muted flex items-center gap-2 text-xs whitespace-nowrap">
                <ApplicableSwitch label="추가할 회원 납부 대상" checked={newApplicable} onChange={setNewApplicable} />
                {newApplicable ? '납부 대상으로 추가' : '비대상으로 추가'}
              </label>
            </div>
            <div className="max-h-[180px] overflow-y-auto">
              {visibleCandidates.length === 0 ? (
                <p className="text-faint py-3 text-center text-xs">추가할 수 있는 회원이 없습니다.</p>
              ) : (
                <ul className="flex flex-col">
                  {visibleCandidates.map((member) => (
                    <li key={member.id} className="border-line flex items-center gap-3 border-b py-2 last:border-b-0">
                      <span className="text-xs font-semibold">{member.name}</span>
                      <span className="text-muted text-[11px]">
                        {member.studentNumber} · {member.track}
                      </span>
                      <Button className="ml-auto" onClick={() => addMember(member)}>
                        추가
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <Button variant="dashed" onClick={() => setIsAdding(true)}>
            + 회원 추가
          </Button>
        )}
      </div>
    </Modal>
  );
}

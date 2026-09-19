'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { Track } from '@/api/auth/types';
import { memberQueries } from '@/api/member/queries';
import { EMPTY_MEMBER_FILTERS } from '@/api/member/types';
import { TRACK_OPTIONS } from '@/app/(admin)/members/components/options';
import { Avatar } from '@/components/ui/avatar';
import { Badge, Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { INPUT_CLASS_COMPACT } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';

const PAGE_SIZE = 8;

/**
 * 명부 검색 후 여러 명을 골라 확정하는 모달. 트랙 멤버 배정(MembersSection)의
 * AssignMemberModal과 같은 UI를 쓰지만, 게임 참여 멤버(T-38)와 멘토 슬롯(T-40)
 * 두 곳에서 그대로 재사용하려고 여기 하나로 뺐다 — 트랙 쪽 원본은 건드리지 않는다.
 */
export function MemberPickerModal({
  title,
  eyebrow,
  existingMemberIds,
  confirmLabel = '추가',
  isPending = false,
  error,
  onClose,
  onConfirm,
}: {
  title: string;
  eyebrow: string;
  existingMemberIds: number[];
  confirmLabel?: string;
  isPending?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (memberIds: number[]) => void;
}) {
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [trackFilter, setTrackFilter] = useState<Track[]>([]);
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(keywordInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  const { data, isLoading } = useQuery(
    memberQueries.directory({
      ...EMPTY_MEMBER_FILTERS,
      keyword,
      track: trackFilter,
      page,
      size: PAGE_SIZE,
      sort: 'name',
      direction: 'asc',
      isAdmin: true,
    }),
  );

  const existing = new Set(existingMemberIds);
  const candidates = (data?.members ?? []).filter((member) => !existing.has(member.id));
  const totalPages = data?.page.totalPages ?? 0;

  function toggleTrack(track: Track) {
    setTrackFilter((prev) => (prev.includes(track) ? prev.filter((t) => t !== track) : [...prev, track]));
    setPage(0);
  }

  function toggleSelected(memberId: number) {
    setSelectedIds((prev) => (prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]));
  }

  return (
    <Modal
      title={title}
      eyebrow={eyebrow}
      onClose={onClose}
      width="480px"
      footer={
        <>
          <span className="text-faint mr-auto text-[11px]">{selectedIds.length}명 선택됨</span>
          <Button onClick={onClose} className="px-4 py-2.5">
            취소
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(selectedIds)}
            disabled={selectedIds.length === 0 || isPending}
            className="px-[18px] py-2.5"
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 px-6 py-5">
        <input
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          placeholder="이름으로 검색"
          className={INPUT_CLASS_COMPACT}
        />

        <div className="flex flex-wrap gap-1.5">
          <Chip
            size="xs"
            pressed={trackFilter.length === 0}
            onPressedChange={() => setTrackFilter([])}
            className="cursor-pointer"
          >
            전체
          </Chip>
          {TRACK_OPTIONS.map((track) => (
            <Chip
              key={track}
              size="xs"
              pressed={trackFilter.includes(track)}
              onPressedChange={() => toggleTrack(track)}
              className="cursor-pointer"
            >
              {track}
            </Chip>
          ))}
        </div>

        <div className="border-line flex max-h-80 flex-col gap-1 overflow-y-auto rounded-[11px] border p-1.5">
          {isLoading ? (
            <p className="text-faint m-0 p-3 text-[13px]">불러오는 중…</p>
          ) : candidates.length === 0 ? (
            <p className="text-faint m-0 p-3 text-[13px]">
              {existing.size > 0 && (data?.members.length ?? 0) > 0
                ? '검색된 부원은 이미 모두 추가되어 있습니다.'
                : '검색 결과가 없습니다.'}
            </p>
          ) : (
            candidates.map((member) => (
              <label
                key={member.id}
                className="hover:bg-panel2 flex cursor-pointer items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13px]"
              >
                <Checkbox checked={selectedIds.includes(member.id)} onCheckedChange={() => toggleSelected(member.id)} />
                <Avatar src={member.photoUrl} name={member.name} size="sm" />
                <span className="truncate">{member.name}</span>
                <Badge className="ml-auto flex-none">{member.track}</Badge>
                <span className="text-faint flex-none text-[11px]">{member.memberType}</span>
              </label>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 text-[12px]">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="text-muted disabled:text-faint cursor-pointer disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="text-faint">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="text-muted disabled:text-faint cursor-pointer disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}

        {error && <p className="text-danger m-0 text-[11px]">{error}</p>}
      </div>
    </Modal>
  );
}

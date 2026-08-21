'use client';

import { AVATAR_COLORS, TRACK_HUE } from '@/components/members/constants';
import type { Member } from '@/components/members/types';

interface MembersTableRowProps {
  member: Member;
  gridTemplate: string;
  mine: boolean;
  isMe: boolean;
  isChair: boolean;
  canManage: boolean;
  onToggleActive: (member: Member) => void;
  onOpenStatus: (member: Member) => void;
  onOpenPerm: (member: Member) => void;
  onOpenPhoto: (member: Member) => void;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}

export function MembersTableRow({
  member,
  gridTemplate,
  mine,
  isMe,
  isChair,
  canManage,
  onToggleActive,
  onOpenStatus,
  onOpenPerm,
  onOpenPhoto,
  onEdit,
  onDelete,
}: MembersTableRowProps) {
  const hue = TRACK_HUE[member.track] ?? '#D08AF7';
  const avatarColor = AVATAR_COLORS[member.id % AVATAR_COLORS.length];

  return (
    <div
      className="grid items-center border-b border-[rgba(0,0,0,0.06)]"
      style={{ gridTemplateColumns: gridTemplate, background: isMe ? 'rgba(195,96,243,0.05)' : 'transparent' }}
    >
      <div className="px-3 py-[9px]">
        <button
          onClick={() => onOpenPhoto(member)}
          style={{ background: avatarColor }}
          className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full border border-[rgba(0,0,0,0.14)] text-xs font-bold text-white"
        >
          {member.name.slice(0, 1)}
        </button>
      </div>
      <div className="px-3 py-3 font-bold whitespace-nowrap tabular-nums">{member.gen}</div>
      <div className="px-3 py-3 whitespace-nowrap">
        <span
          style={{ background: `${hue}22`, color: hue }}
          className="rounded-md px-[9px] py-[3px] text-[11.5px] font-semibold whitespace-nowrap"
        >
          {member.track}
        </span>
      </div>
      <div className="px-3 py-3 whitespace-nowrap text-[#3C3C46]">{member.grade}</div>
      <div className="px-3 py-3 whitespace-nowrap">
        {mine ? (
          <button
            onClick={() => onOpenStatus(member)}
            className="cursor-pointer rounded-full border border-[rgba(0,0,0,0.16)] bg-[rgba(0,0,0,0.04)] px-2.5 py-1 text-[11.5px] whitespace-nowrap text-[#2B2B34]"
          >
            {member.enroll} ▾
          </button>
        ) : (
          <span className="whitespace-nowrap text-[#3C3C46]">{member.enroll}</span>
        )}
      </div>
      <div className="flex items-center gap-[7px] px-3 py-3 font-bold whitespace-nowrap">
        <span>{member.name}</span>
        {isMe && (
          <span className="rounded-full bg-[rgba(195,96,243,0.14)] px-[7px] py-[2px] text-[10.5px] font-bold whitespace-nowrap text-[#8F27C4]">
            나
          </span>
        )}
      </div>
      <div className="overflow-hidden px-3 py-3 text-ellipsis whitespace-nowrap text-[#6C6C78]">{member.org}</div>
      <div className="overflow-hidden px-3 py-3 text-ellipsis whitespace-nowrap text-[#6C6C78]">{member.dept}</div>
      <div className="px-3 py-3 whitespace-nowrap text-[#3C3C46] tabular-nums">{member.sid}</div>
      <div className="px-3 py-3 whitespace-nowrap text-[#6C6C78] tabular-nums">{member.phone}</div>
      <div className="overflow-hidden px-3 py-3 text-ellipsis whitespace-nowrap text-[#6C6C78]">{member.email}</div>
      <div
        className="overflow-hidden px-3 py-3 text-ellipsis whitespace-nowrap"
        style={{ color: member.role === '—' ? '#9A9AA6' : '#3C3C46' }}
      >
        {member.role}
      </div>
      <div className="overflow-hidden px-3 py-3 text-ellipsis whitespace-nowrap text-[#6C6C78]">{member.github}</div>
      <div className="px-3 py-3 whitespace-nowrap text-[#6C6C78] tabular-nums">{member.birth}</div>
      <div
        className="px-3 py-3 text-center font-bold whitespace-nowrap"
        style={{ color: member.paid === 'O' ? '#8F27C4' : '#9A9AA6' }}
      >
        {member.paid}
      </div>
      <div className="px-3 py-3 whitespace-nowrap">
        {mine ? (
          <button
            onClick={() => onToggleActive(member)}
            className="inline-flex cursor-pointer items-center gap-2.5 border-none bg-transparent p-0"
          >
            <span
              className="relative inline-block h-5 w-9 flex-none rounded-full transition-[background]"
              style={{ background: member.active ? '#C360F3' : 'rgba(0,0,0,0.18)' }}
            >
              <span
                className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[left]"
                style={{ left: member.active ? '18px' : '2px' }}
              />
            </span>
            <span className="text-xs whitespace-nowrap" style={{ color: member.active ? '#8F27C4' : '#6C6C78' }}>
              {member.active ? '활동' : '비활동'}
            </span>
          </button>
        ) : (
          <span className="text-xs whitespace-nowrap" style={{ color: member.active ? '#8F27C4' : '#6C6C78' }}>
            {member.active ? '활동' : '비활동'}
          </span>
        )}
      </div>
      <div className="flex gap-2.5 px-3 py-3 text-xs whitespace-nowrap">
        {mine && (
          <button onClick={() => onEdit(member)} className="cursor-pointer border-none bg-transparent p-0 text-[#8F27C4]">
            수정
          </button>
        )}
        {isChair && (
          <button
            onClick={() => onOpenPerm(member)}
            className="cursor-pointer border-none bg-transparent p-0 text-[var(--accent)]"
          >
            권한
          </button>
        )}
        {canManage && (
          <button onClick={() => onDelete(member)} className="cursor-pointer border-none bg-transparent p-0 text-[#9A9AA6]">
            삭제
          </button>
        )}
      </div>
    </div>
  );
}

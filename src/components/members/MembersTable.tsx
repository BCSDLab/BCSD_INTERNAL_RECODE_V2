'use client';

import { MembersTableRow } from '@/components/members/MembersTableRow';
import type { Member } from '@/components/members/types';

interface MembersTableProps {
  columns: string[];
  gridTemplate: string;
  tableMinWidth: string;
  rows: Member[];
  isAdmin: boolean;
  meId: number;
  onToggleActive: (member: Member) => void;
  onOpenStatus: (member: Member) => void;
  onOpenPerm: (member: Member) => void;
  onOpenPhoto: (member: Member) => void;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}

export function MembersTable({ columns, gridTemplate, tableMinWidth, rows, isAdmin, meId, ...handlers }: MembersTableProps) {
  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: tableMinWidth }} className="text-[13px]">
        <div
          className="grid border-b border-[rgba(0,0,0,0.09)] bg-[rgba(0,0,0,0.035)]"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {columns.map((column, i) => (
            <div
              key={i}
              className="overflow-hidden px-3 py-[13px] text-[11.5px] font-bold tracking-[.04em] whitespace-nowrap text-[#6C6C78]"
            >
              {column}
            </div>
          ))}
        </div>
        {rows.map((member) => (
          <MembersTableRow
            key={member.id}
            member={member}
            gridTemplate={gridTemplate}
            mine={isAdmin || member.id === meId}
            isMe={member.id === meId}
            isChair={isAdmin}
            canManage={isAdmin}
            {...handlers}
          />
        ))}
      </div>
    </div>
  );
}

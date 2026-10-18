import { Menu } from '@base-ui/react/menu';
import { Check, Columns3 } from 'lucide-react';

import { OPTIONAL_MEMBER_COLUMNS, type OptionalMemberColumn } from '../../model/columns';
import { MENU_CHECK_BOX_CLASS, MENU_ITEM_CLASS, MENU_POPUP_CLASS } from './menu-styles';

/** 기본 열 외에 표에 더 보일 열을 고른다. 관리자 전용 열(직장)은 일반 권한에 보이지 않는다. */
export function MemberColumnMenu({
  isAdmin,
  columns,
  onToggle,
}: {
  isAdmin: boolean;
  columns: OptionalMemberColumn[];
  onToggle: (column: OptionalMemberColumn) => void;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger className="border-line2 text-muted hover:border-primary-line hover:text-primary-text data-popup-open:border-primary-line data-popup-open:text-primary-text inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-[9px] border px-3 py-2 text-xs whitespace-nowrap transition-colors">
        <Columns3 size={14} aria-hidden="true" />열 설정
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end" className="z-50 outline-none">
          <Menu.Popup aria-label="표에 보일 열" className={MENU_POPUP_CLASS}>
            <div className="text-faint px-2.5 pt-1.5 pb-1 text-[11px]">추가로 보일 열</div>
            {OPTIONAL_MEMBER_COLUMNS.filter((column) => isAdmin || !column.adminOnly).map((column) => (
              <Menu.CheckboxItem
                key={column.key}
                checked={columns.includes(column.key)}
                onCheckedChange={() => onToggle(column.key)}
                closeOnClick={false}
                className={`group ${MENU_ITEM_CLASS}`}
              >
                <span className={MENU_CHECK_BOX_CLASS} aria-hidden="true">
                  <Menu.CheckboxItemIndicator className="flex items-center justify-center">
                    <Check size={11} strokeWidth={3} />
                  </Menu.CheckboxItemIndicator>
                </span>
                {column.label}
              </Menu.CheckboxItem>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

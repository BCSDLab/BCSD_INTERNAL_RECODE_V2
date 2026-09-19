'use client';

import { Switch as SwitchPrimitive } from '@base-ui/react/switch';

/**
 * 활동 여부(MemberTable) · 공개 토글(ActivityEditModal) · 모집 상태(RecruitLinkSection)
 * 세 곳이 트랙+손잡이 마크업(h-[18px] w-8 트랙, h-3.5 w-3.5 손잡이)을 각자 따로
 * 구현하고 있었다 — 색·크기는 전부 동일해서 이 위젯만 뽑는다.
 */
const TRACK_CLASS =
  'data-checked:bg-primary data-unchecked:bg-line2 relative h-[18px] w-8 flex-none rounded-full transition-colors';
const THUMB_CLASS =
  'bg-on-primary data-unchecked:bg-panel data-checked:right-0.5 data-unchecked:left-0.5 absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all';

/** 단독 스위치 — 라벨 텍스트를 옆에 두는 인라인 행(MemberTable)에서 쓴다. */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className = '',
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={`${TRACK_CLASS} data-disabled:cursor-default data-disabled:opacity-45 ${className}`}
    >
      <SwitchPrimitive.Thumb className={THUMB_CLASS} />
    </SwitchPrimitive.Root>
  );
}

/**
 * 테두리 있는 카드 전체가 스위치인 행(ActivityEditModal의 공개 토글, RecruitLinkSection의
 * 모집 상태)에서 쓴다. 카드의 테두리·배경·패딩은 화면마다 달라 className으로 그대로
 * 받는다 — <label>로 감쌌다가 Field의 바깥 <label>과 중첩되는 문제가 있어(중첩 label은
 * 유효하지 않은 HTML이고 클릭이 이중으로 먹는다) 카드 자체를 Switch.Root로 만든다.
 */
export function SwitchRow({
  checked,
  onCheckedChange,
  children,
  className = '',
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={`flex cursor-pointer items-center ${className}`}
    >
      {children}
      <span className={`ml-auto ${TRACK_CLASS}`}>
        <SwitchPrimitive.Thumb className={THUMB_CLASS} />
      </span>
    </SwitchPrimitive.Root>
  );
}

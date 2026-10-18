/**
 * 필터 드롭다운·열 설정·행 관리 메뉴가 함께 쓰는 Base UI Menu 팝업 모양.
 * Portal이 AdminLayout의 text-text 래퍼 밖에 그려지므로 팝업에 text-text를 다시 건다(modal.tsx 참고).
 */
export const MENU_POPUP_CLASS =
  'border-line bg-panel text-text max-h-[min(420px,var(--available-height))] min-w-[200px] overflow-auto rounded-[12px] border p-1.5 shadow-[0_10px_30px_rgba(27,11,40,.18)] outline-none';

export const MENU_ITEM_CLASS =
  'data-highlighted:bg-panel2 flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] whitespace-nowrap outline-none';

/** CheckboxItem 안의 체크 상자. 부모 항목의 data-checked를 group으로 읽는다. */
export const MENU_CHECK_BOX_CLASS =
  'border-line2 group-data-checked:border-primary group-data-checked:bg-primary text-on-primary flex h-4 w-4 flex-none items-center justify-center rounded-[4px] border transition-colors';

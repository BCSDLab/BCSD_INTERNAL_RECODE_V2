'use client';

import { Select as SelectPrimitive } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: React.ReactNode;
}

/**
 * 네이티브 <select>를 대체한다. 지금까지 <select className={INPUT_CLASS_COMPACT}>로
 * 텍스트 인풋과 시각적으로는 이미 통일돼 있었지만, 브라우저 기본 드롭다운 화살표만은
 * 그대로였다 — 그 화살표를 lucide ChevronDown으로, 팝업을 패널 스타일로 바꿔 완전히
 * 통일한다. 대신 iOS/Android의 네이티브 휠 피커는 잃는다(대화에서 확인한 트레이드오프).
 *
 * 옵션은 호출부가 만든 배열을 그대로 받는다 — MemberFormModal의 "빈 값 전용 옵션"처럼
 * 화면마다 다른 옵션 구성 로직을 이 컴포넌트 안으로 끌어오지 않는다.
 *
 * multiple을 켜면 값·콜백이 string[]이 된다(Base UI Select가 그대로 지원 — 항목을 눌러도
 * 팝업이 닫히지 않고 계속 고를 수 있다). 트리거에는 고른 라벨을 쉼표로 이어 보여준다.
 */
type SelectSingleProps = {
  multiple?: false;
  value: string;
  onValueChange: (value: string) => void;
};

type SelectMultipleProps = {
  multiple: true;
  value: string[];
  onValueChange: (value: string[]) => void;
};

export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  className = '',
  disabled,
  multiple,
}: (SelectSingleProps | SelectMultipleProps) & {
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}) {
  const labelByValue = new Map(options.map((option) => [option.value, option.label]));

  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={(next) => onValueChange((multiple ? (next ?? []) : (next ?? '')) as never)}
      disabled={disabled}
      items={options}
      multiple={multiple}
    >
      <SelectPrimitive.Trigger
        className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-[10px] border border-line bg-panel2 text-sm text-text outline-none transition-colors focus:border-primary-line focus:bg-primary-sunken data-disabled:cursor-default data-disabled:opacity-45 data-placeholder:text-faint ${className}`}
      >
        {multiple ? (
          <span className={`truncate ${value.length === 0 ? 'text-faint' : ''}`}>
            {value.length > 0 ? value.map((v) => labelByValue.get(v) ?? v).join(', ') : placeholder}
          </span>
        ) : (
          <SelectPrimitive.Value placeholder={placeholder} className="truncate" />
        )}
        <SelectPrimitive.Icon className="text-faint flex-none">
          <ChevronDown size={14} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner sideOffset={4} className="z-50 outline-none">
          <SelectPrimitive.Popup className="border-line bg-panel max-h-64 min-w-32 overflow-auto rounded-[10px] border py-1 shadow-[0_10px_30px_rgba(27,11,40,.18)] outline-none">
            <SelectPrimitive.List>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className="data-highlighted:bg-panel2 data-selected:text-primary-text text-text flex cursor-pointer items-center gap-2 px-3 py-2 text-sm outline-none"
                >
                  <SelectPrimitive.ItemIndicator className="text-primary-text flex-none">
                    <Check size={14} />
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

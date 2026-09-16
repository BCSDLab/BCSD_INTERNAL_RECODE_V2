'use client';

import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { Check } from 'lucide-react';

/**
 * 지금까지 스타일이 전혀 없던 순수 브라우저 기본 체크박스를 대체한다 — 프로젝트에서
 * 디자인 토큰을 하나도 안 쓰던 유일한 인터랙티브 요소였다. line 테두리 정사각형 +
 * 체크 시 primary 채우기로 다른 컴포넌트와 통일한다.
 */
export function Checkbox({
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
    <CheckboxPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={`border-line data-checked:border-primary data-checked:bg-primary flex h-4 w-4 flex-none items-center justify-center rounded-[4px] border bg-panel2 outline-none transition-colors data-disabled:cursor-default data-disabled:opacity-45 ${className}`}
    >
      <CheckboxPrimitive.Indicator className="text-on-primary flex items-center justify-center">
        <Check size={11} strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

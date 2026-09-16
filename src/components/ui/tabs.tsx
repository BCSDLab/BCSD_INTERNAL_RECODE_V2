'use client';

import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';

/**
 * games/[gameId], reservations 화면이 각자 <button onClick>으로 만들던 밑줄 탭을
 * 대체한다. 둘 다 이미 진짜 버튼이라 클릭·포커스는 됐지만 role="tab"/화살표 키 이동이
 * 없었다. Base UI Tabs가 관리한다. Panel은 비활성 탭을 언마운트한다(지금까지의
 * `{tab === x && ...}` 조건부 렌더링과 동일하게 동작한다).
 */
export const Tabs = TabsPrimitive.Root;

export function TabsList({ className = '', ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={`border-line flex gap-1 border-b ${className}`} {...props} />;
}

export function TabsTab({ className = '', ...props }: React.ComponentProps<typeof TabsPrimitive.Tab>) {
  return (
    <TabsPrimitive.Tab
      className={`text-muted hover:text-text data-active:border-primary data-active:text-text cursor-pointer border-b-2 border-transparent px-3.5 py-2.5 text-[13px] whitespace-nowrap transition-colors data-active:font-semibold ${className}`}
      {...props}
    />
  );
}

export const TabsPanel = TabsPrimitive.Panel;

'use client';

import { KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useCallback, useState } from 'react';

export interface SortableItem {
  id: number;
}

/**
 * dnd-kit 센서 설정 + 낙관적 재배열 + PATCH .../order 호출을 한 곳에 묶는다. 서버가
 * display_order를 재부여하므로, 성공하면 호출한 쪽에서 invalidateQueries로 정본을
 * 다시 읽어야 한다. 실패하면 드래그 이전 순서로 롤백한다.
 */
export function useSortableList<T extends SortableItem>(serverItems: T[], reorderFn: (ids: number[]) => Promise<void>) {
  const [items, setItems] = useState<T[]>(serverItems);
  // 서버 데이터(예: invalidateQueries 이후 새 목록)가 바뀌면 로컬 낙관적 상태를 다시
  // 맞춘다. 렌더 중 setState — effect가 아니다(React가 문서화한 "props 변경에 따라
  // state 조정" 패턴). 이렇게 하면 불필요한 추가 렌더 없이 다음 렌더에서 바로 반영된다.
  const [syncedServerItems, setSyncedServerItems] = useState(serverItems);
  if (serverItems !== syncedServerItems) {
    setSyncedServerItems(serverItems);
    setItems(serverItems);
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const previous = items;
      const reordered = arrayMove(items, oldIndex, newIndex);
      setItems(reordered);

      try {
        await reorderFn(reordered.map((item) => item.id));
      } catch (error) {
        setItems(previous);
        throw error;
      }
    },
    [items, reorderFn],
  );

  return { items, sensors, handleDragEnd };
}

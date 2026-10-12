import { useBlocker, type ShouldBlockFn } from '@tanstack/react-router';

export function confirmDiscardChanges() {
  return window.confirm('작성 중인 내용을 버리고 이동할까요?');
}

/** Retain drafts for harmless search changes when a screen supplies its context comparison. */
export function useDraftGuard(dirty: boolean, leavesContext?: ShouldBlockFn, onDiscard?: () => void, busy = false) {
  useBlocker({
    enableBeforeUnload: dirty || busy,
    shouldBlockFn: async (locations) => {
      if (busy && (!leavesContext || (await leavesContext(locations)))) return true;
      if (!dirty || (leavesContext && !(await leavesContext(locations)))) return false;
      if (!confirmDiscardChanges()) return true;
      onDiscard?.();
      return false;
    },
  });
}

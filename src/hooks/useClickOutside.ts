import { useEffect, type RefObject } from 'react';

/**
 * Calls `handler` on a pointer-down or focus outside any of the given refs,
 * and on Escape. Pass `enabled: false` to detach the listeners.
 */
export function useClickOutside(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  handler: () => void,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;

    const list = Array.isArray(refs) ? refs : [refs];

    const isInside = (target: Node | null): boolean =>
      list.some((ref) => ref.current && target && ref.current.contains(target));

    const onPointerDown = (event: PointerEvent | MouseEvent | TouchEvent) => {
      if (!isInside(event.target as Node | null)) handler();
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!isInside(event.target as Node | null)) handler();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handler();
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [refs, handler, enabled]);
}

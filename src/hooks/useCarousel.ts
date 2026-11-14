import { useCallback, useEffect, useRef, useState } from 'react';

interface Carousel<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  atStart: boolean;
  atEnd: boolean;
  /** True when the content does not overflow, so arrows can be hidden. */
  canScroll: boolean;
  scrollPrev: () => void;
  scrollNext: () => void;
  onScroll: () => void;
}

/**
 * Horizontal scroll container with prev/next controls and edge detection —
 * the React equivalent of the original Alpine `slider()` helper.
 */
export function useCarousel<T extends HTMLElement = HTMLDivElement>(): Carousel<T> {
  const ref = useRef<T | null>(null);
  const [state, setState] = useState({ atStart: true, atEnd: false, canScroll: false });

  const measure = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    const maxScroll = element.scrollWidth - element.clientWidth;
    setState({
      atStart: element.scrollLeft <= 4,
      atEnd: element.scrollLeft >= maxScroll - 4,
      canScroll: maxScroll > 8,
    });
  }, []);

  useEffect(() => {
    measure();

    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    for (const child of Array.from(element.children)) observer.observe(child);

    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  const scrollBy = useCallback((direction: -1 | 1) => {
    const element = ref.current;
    if (!element) return;
    element.scrollBy({ left: direction * element.clientWidth * 0.8, behavior: 'smooth' });
  }, []);

  return {
    ref,
    atStart: state.atStart,
    atEnd: state.atEnd,
    canScroll: state.canScroll,
    scrollPrev: () => scrollBy(-1),
    scrollNext: () => scrollBy(1),
    onScroll: measure,
  };
}

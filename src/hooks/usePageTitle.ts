import { useEffect } from 'react';
import { SITE } from '@/lib/site';

/**
 * Sets `document.title` for the current page and restores the previous title
 * on unmount. Pass `null` to leave the default brand title in place.
 */
export function usePageTitle(title: string | null, options?: { description?: string }): void {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} | ${SITE.name}` : `${SITE.name} — Reliable UK Airport Transfers`;

    let previousDescription: string | null = null;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (options?.description && meta) {
      previousDescription = meta.content;
      meta.content = options.description;
    }

    return () => {
      document.title = previous;
      if (meta && previousDescription !== null) meta.content = previousDescription;
    };
  }, [title, options?.description]);
}

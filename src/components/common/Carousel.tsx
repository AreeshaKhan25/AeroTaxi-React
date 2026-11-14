import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from '@/components/ui/Button';
import { useCarousel } from '@/hooks/useCarousel';

export interface CarouselItem {
  id: string | number;
  content: React.ReactNode;
}

interface CarouselProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  items: CarouselItem[];
  /** Width classes applied to every item wrapper. */
  itemClassName?: string;
  label: string;
  className?: string;
}

/** Horizontal card rail with prev/next controls, used on the home page. */
export function Carousel({
  title,
  subtitle,
  items,
  itemClassName = 'w-44 sm:w-56',
  label,
  className,
}: CarouselProps) {
  const { ref, atStart, atEnd, canScroll, scrollPrev, scrollNext, onScroll } =
    useCarousel<HTMLUListElement>();

  return (
    <div className={className}>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-500 sm:text-base">{subtitle}</p>}
        </div>
        {canScroll && (
          <div className="flex flex-shrink-0 items-center gap-2">
            <IconButton label={`Scroll ${label} left`} onClick={scrollPrev} disabled={atStart}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </IconButton>
            <IconButton label={`Scroll ${label} right`} onClick={scrollNext} disabled={atEnd}>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </IconButton>
          </div>
        )}
      </div>

      <ul
        ref={ref as React.RefObject<HTMLUListElement>}
        onScroll={onScroll}
        aria-label={label}
        className="hide-scrollbar flex gap-5 overflow-x-auto scroll-smooth pb-2"
      >
        {items.map((item) => (
          <li key={item.id} className={cn('flex-shrink-0', itemClassName)}>
            {item.content}
          </li>
        ))}
      </ul>
    </div>
  );
}

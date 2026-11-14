import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface AccordionItem {
  id: string | number;
  question: React.ReactNode;
  answer: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  /** Index opened on first render; `null` keeps everything collapsed. */
  defaultOpen?: number | null;
  className?: string;
}

/** Single-open accordion with an animated, height-aware panel. */
export function Accordion({ items, defaultOpen = null, className }: AccordionProps) {
  const [openId, setOpenId] = useState<string | number | null>(
    defaultOpen !== null ? items[defaultOpen]?.id ?? null : null,
  );
  const baseId = useId();

  return (
    <div className={cn('divide-y divide-gray-200', className)}>
      {items.map((item) => {
        const open = openId === item.id;
        const panelId = `${baseId}-panel-${item.id}`;
        const buttonId = `${baseId}-button-${item.id}`;

        return (
          <div key={item.id} className="py-1">
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : item.id)}
                className="group flex w-full items-center justify-between gap-4 rounded-lg py-4 text-left transition-colors hover:text-primary-700"
              >
                <span className="font-semibold text-gray-900 group-hover:text-primary-700">
                  {item.question}
                </span>
                <ChevronDown
                  aria-hidden
                  className={cn(
                    'h-4 w-4 flex-shrink-0 text-gray-500 transition-transform duration-300',
                    open && 'rotate-180 text-primary-700',
                  )}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              className={cn(
                'grid transition-all duration-300 ease-spring',
                open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
              )}
            >
              <div className="overflow-hidden">
                <div className="pb-4 text-sm leading-relaxed text-gray-600">{item.answer}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

interface StepProgressProps {
  /** 1-based index of the current step. Use `steps.length + 1` for "all done". */
  current: number;
  steps?: readonly string[];
  className?: string;
}

const DEFAULT_STEPS = ['Your ride', 'Transfer details', 'Payment'] as const;

export function StepProgress({ current, steps = DEFAULT_STEPS, className }: StepProgressProps) {
  const allComplete = current > steps.length;

  return (
    <div className={cn('border-b border-gray-100 bg-white', className)}>
      <nav aria-label="Booking progress" className="container-narrow py-5">
        <ol className="flex items-center justify-center">
          {steps.map((label, index) => {
            const step = index + 1;
            const complete = allComplete || step < current;
            const active = !allComplete && step === current;

            return (
              <li key={label} className="flex items-center">
                {index > 0 && (
                  <span
                    aria-hidden
                    className={cn(
                      'mx-2 h-[2px] w-12 sm:mx-3 sm:w-24',
                      complete || active ? 'bg-accent' : 'bg-gray-200',
                      allComplete && 'bg-green-300',
                    )}
                  />
                )}
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold',
                      allComplete
                        ? 'bg-green-500 text-white'
                        : complete
                          ? 'bg-accent text-ink shadow-sm'
                          : active
                            ? 'bg-accent text-ink shadow-sm'
                            : 'border border-gray-200 bg-gray-100 text-gray-400',
                    )}
                  >
                    {allComplete || complete ? (
                      <Check className="h-4 w-4" aria-hidden />
                    ) : (
                      step
                    )}
                  </span>
                  <span
                    className={cn(
                      'hidden text-sm sm:inline',
                      active ? 'font-semibold text-gray-900' : 'font-medium text-gray-400',
                      allComplete && index === steps.length - 1 && 'font-semibold text-gray-900',
                    )}
                  >
                    {label}
                  </span>
                </span>
              </li>
            );
          })}

          {allComplete && (
            <li className="flex items-center">
              <span aria-hidden className="mx-2 h-[2px] w-12 bg-green-300 sm:mx-3 sm:w-24" />
              <span className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white">
                  <Check className="h-4 w-4" aria-hidden />
                </span>
                <span className="hidden text-sm font-semibold text-gray-900 sm:inline">
                  Confirmed
                </span>
              </span>
            </li>
          )}
        </ol>
      </nav>
    </div>
  );
}

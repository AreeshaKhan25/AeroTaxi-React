import { Check, Flag, MapPin } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { DateTimePicker } from './DateTimePicker';
import { LocationAutocomplete } from './LocationAutocomplete';

/** What every fare covers — shown under the hero search button. */
const INCLUDED = [
  '24/7 customer support',
  'Free cancellation up to 24h before',
  'Free flight tracking',
  'Child seats included free',
] as const;

export interface JourneySelection {
  from: string;
  to: string;
  date: string;
  time: string;
}

interface BookingSearchFormProps {
  value: JourneySelection;
  onChange: (next: JourneySelection) => void;
  onSubmit?: () => void;
  variant?: 'hero' | 'compact';
  submitLabel?: string;
  errors?: Partial<Record<keyof JourneySelection, string>>;
  className?: string;
}

function SwapButton({
  onClick,
  compact,
}: {
  onClick: () => void;
  compact: boolean;
}) {
  return (
    <div className={cn('relative z-20 flex justify-end', compact ? '-my-3 pr-3' : '-my-5 pr-4')}>
      <button
        type="button"
        onClick={onClick}
        aria-label="Swap pickup and drop-off"
        title="Swap pickup and drop-off"
        className={cn(
          /* A ring in the card colour punches the control out of the two
             fields it straddles, so it reads as deliberate rather than
             as a button that has slipped over the border. */
          'flex items-center justify-center rounded-full bg-accent shadow-card ring-4 ring-cream',
          'transition-transform duration-300 hover:rotate-180 hover:bg-accent-500 active:scale-95',
          'motion-reduce:transition-none motion-reduce:hover:rotate-0',
          compact ? 'h-8 w-8' : 'h-11 w-11',
        )}
      >
        <img
          src="/images/swap-icon.png"
          alt=""
          aria-hidden
          className={compact ? 'h-5 w-5' : 'h-8 w-8'}
        />
      </button>
    </div>
  );
}

/**
 * The journey search card. `hero` is the large home-page form, `compact` the
 * editable sidebar on the "Your ride" step.
 */
export function BookingSearchForm({
  value,
  onChange,
  onSubmit,
  variant = 'hero',
  submitLabel = 'Check Prices',
  errors,
  className,
}: BookingSearchFormProps) {
  const compact = variant === 'compact';
  const size = compact ? 'sm' : 'md';

  const patch = (partial: Partial<JourneySelection>) => onChange({ ...value, ...partial });

  const swap = () => patch({ from: value.to, to: value.from });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit?.();
  };

  const bothLocationsSet = Boolean(value.from.trim() && value.to.trim());

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        compact ? 'rounded-2xl bg-cream p-5' : 'rounded-[20px] bg-cream p-5 md:px-8 lg:py-7',
        className,
      )}
    >
      {!compact && <h2 className="mb-6 text-xl font-bold text-gray-900">Book your ride</h2>}

      <div className={compact ? 'border-b border-gray-200/60 py-2' : undefined}>
        <LocationAutocomplete
          value={value.from}
          onChange={(from) => patch({ from })}
          placeholder="From"
          ariaLabel="Pickup location"
          icon={<MapPin className="h-4 w-4" aria-hidden />}
          size={size}
          clearable={compact}
          required={!compact}
          invalid={Boolean(errors?.from)}
        />
        {errors?.from && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.from}</p>}
      </div>

      <SwapButton onClick={swap} compact={compact} />

      <div className={compact ? 'border-b border-gray-200/60 py-2' : undefined}>
        <LocationAutocomplete
          value={value.to}
          onChange={(to) => patch({ to })}
          placeholder="To"
          ariaLabel="Drop-off location"
          icon={<Flag className="h-4 w-4" aria-hidden />}
          size={size}
          clearable={compact}
          required={!compact}
          invalid={Boolean(errors?.to)}
        />
        {errors?.to && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.to}</p>}
      </div>

      <div className={compact ? 'py-2' : 'mt-3'}>
        <DateTimePicker
          date={value.date}
          time={value.time}
          onChange={({ date, time }) => patch({ date, time })}
          size={size}
          invalid={Boolean(errors?.date)}
          autoOpen={!compact && bothLocationsSet}
        />
        {errors?.date && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.date}</p>}
      </div>

      {onSubmit && (
        <div
          className={cn(
            'flex flex-col items-start gap-4 sm:flex-row sm:items-center',
            compact ? 'mt-4' : 'mt-3',
          )}
        >
          <Button type="submit" size={compact ? 'md' : 'lg'} className={compact ? 'w-full' : undefined}>
            {submitLabel}
          </Button>
          {!compact && (
            <ul className="grid gap-x-5 gap-y-1.5 text-xs text-gray-600 sm:grid-cols-2">
              {INCLUDED.map((item) => (
                <li key={item} className="flex items-start gap-1.5">
                  <Check className="mt-px h-3.5 w-3.5 shrink-0 text-green-600" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}

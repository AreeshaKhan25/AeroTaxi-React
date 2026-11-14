import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import { EXTRA_OPTIONS, type ExtraOption } from '@/lib/pricing';

interface CounterProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

/** Passenger / suitcase / hand-luggage stepper. */
export function Counter({ label, icon, value, min = 0, max = 16, onChange }: CounterProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-400" aria-hidden>
        {icon}
      </span>
      <button
        type="button"
        aria-label={`Fewer ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="h-3 w-3" aria-hidden />
      </button>
      <span className="w-6 text-center font-semibold text-gray-900" aria-live="polite">
        <span className="sr-only">{label}: </span>
        {value}
      </span>
      <button
        type="button"
        aria-label={`More ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-ink transition hover:bg-accent-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-3 w-3" aria-hidden />
      </button>
    </div>
  );
}

function AddToggle({
  added,
  onToggle,
  label,
}: {
  added: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={added}
      aria-label={`${added ? 'Remove' : 'Add'} ${label}`}
      className={cn(
        'rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
        added
          ? 'border-accent bg-accent text-ink'
          : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400',
      )}
    >
      {added ? 'Added' : 'Add'}
    </button>
  );
}

interface ExtrasSectionProps {
  selected: string[];
  onToggle: (id: string) => void;
}

const priceLabel = (option: ExtraOption) =>
  option.price > 0 ? formatCurrency(option.price) : formatCurrency(0);

export function ExtrasSection({ selected, onToggle }: ExtrasSectionProps) {
  const standalone = EXTRA_OPTIONS.filter((option) => !option.group);
  const childSeats = EXTRA_OPTIONS.filter((option) => option.group === 'child-seat');

  const meetGreet = standalone.find((option) => option.id === 'meet-greet');
  const others = standalone.filter((option) => option.id !== 'meet-greet');

  return (
    <div className="divide-y divide-gray-100">
      {meetGreet && (
        <div className="flex items-start justify-between gap-4 py-4">
          <div>
            <p className="text-sm font-bold text-gray-900">{meetGreet.label}</p>
            {meetGreet.description && (
              <p className="mt-0.5 text-xs text-gray-500">{meetGreet.description}</p>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            <span className="text-sm font-semibold text-gray-900">{priceLabel(meetGreet)}</span>
            <AddToggle
              added={selected.includes(meetGreet.id)}
              onToggle={() => onToggle(meetGreet.id)}
              label={meetGreet.label}
            />
          </div>
        </div>
      )}

      <div className="py-4">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-gray-900">
              Child seats <span className="font-normal text-gray-500">(subject to availability)</span>
            </p>
            <p className="mt-0.5 text-xs text-gray-500">Travel with peace of mind</p>
          </div>
          <span className="flex-shrink-0 text-sm font-semibold text-green-600">Free</span>
        </div>
        <div className="ml-1 space-y-2 sm:ml-4">
          {childSeats.map((option) => (
            <div key={option.id} className="flex items-center justify-between gap-4">
              <span className="text-xs text-gray-600">{option.label}</span>
              <AddToggle
                added={selected.includes(option.id)}
                onToggle={() => onToggle(option.id)}
                label={option.label}
              />
            </div>
          ))}
        </div>
      </div>

      {others.map((option) => (
        <div key={option.id} className="flex items-start justify-between gap-4 py-4">
          <div>
            <p className="text-sm font-bold text-gray-900">{option.label}</p>
            {option.description && (
              <p className="mt-0.5 text-xs text-gray-500">{option.description}</p>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            <span className="text-sm font-semibold text-gray-900">{priceLabel(option)}</span>
            <AddToggle
              added={selected.includes(option.id)}
              onToggle={() => onToggle(option.id)}
              label={option.label}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

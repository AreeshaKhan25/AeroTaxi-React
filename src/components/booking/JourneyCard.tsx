import { Briefcase, ShoppingBag, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCurrency, formatJourneyDate } from '@/lib/format';
import type { Vehicle } from '@/types';

interface JourneyCardProps {
  from: string;
  to: string;
  date: string;
  time?: string | null;
  className?: string;
}

/** Read-only From / To / Depart summary shown on steps 2, 3 and the receipt. */
export function JourneyCard({ from, to, date, time, className }: JourneyCardProps) {
  const departure = formatJourneyDate(date, time ?? null);

  return (
    <div className={cn('rounded-2xl bg-cream p-5', className)}>
      <div className="flex items-start gap-3 border-b border-gray-200/60 py-2.5">
        <span className="w-14 flex-shrink-0 text-sm font-medium text-gray-400">From</span>
        <p className="min-w-0 flex-1 break-words text-sm font-semibold text-gray-900">{from}</p>
      </div>

      <div className="relative z-10 -my-3 flex justify-end">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent shadow-sm">
          <img src="/images/swap-icon.png" alt="" aria-hidden className="h-6 w-6" />
        </span>
      </div>

      <div className="flex items-start gap-3 border-b border-gray-200/60 py-2.5">
        <span className="w-14 flex-shrink-0 text-sm font-medium text-gray-400">To</span>
        <p className="min-w-0 flex-1 break-words text-sm font-semibold text-gray-900">{to}</p>
      </div>

      <div className="flex items-start gap-3 py-2.5">
        <span className="w-14 flex-shrink-0 text-sm font-medium text-gray-400">Depart</span>
        <p className="min-w-0 flex-1 text-sm font-semibold text-gray-900">
          {departure ? (
            <>
              {departure.weekday}
              <span className="mx-1 text-gray-300" aria-hidden>
                |
              </span>
              {departure.date}
              {departure.time && (
                <>
                  <span className="mx-1 text-gray-300" aria-hidden>
                    |
                  </span>
                  {departure.time}
                </>
              )}
            </>
          ) : (
            '—'
          )}
        </p>
      </div>
    </div>
  );
}

interface SelectedVehicleCardProps {
  vehicle: Vehicle;
  price: number;
  heading?: string;
  className?: string;
}

export function SelectedVehicleCard({
  vehicle,
  price,
  heading = 'Your ride',
  className,
}: SelectedVehicleCardProps) {
  return (
    <div className={className}>
      {heading && <h3 className="mb-3 text-sm font-bold text-gray-900">{heading}</h3>}
      <div className="rounded-xl border border-gray-100 bg-white p-4">
        <div className="flex items-center gap-4">
          <img
            src={vehicle.image}
            alt={vehicle.name}
            loading="lazy"
            className="h-16 w-20 flex-shrink-0 object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900">{vehicle.name}</p>
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 text-gray-400" aria-hidden /> {vehicle.passengers}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3 text-gray-400" aria-hidden /> {vehicle.suitcases}
              </span>
              <span className="flex items-center gap-1">
                <ShoppingBag className="h-3 w-3 text-gray-400" aria-hidden /> {vehicle.passengers}
              </span>
            </div>
          </div>
          <p className="flex-shrink-0 text-lg font-bold text-gray-900">{formatCurrency(price)}</p>
        </div>
      </div>
    </div>
  );
}

export function TotalBar({ total, label = 'Total' }: { total: number; label?: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border-2 border-accent bg-accent-50 px-5 py-3">
      <span className="font-bold text-gray-900">{label}</span>
      <span className="text-xl font-bold text-gray-900">{formatCurrency(total)}</span>
    </div>
  );
}

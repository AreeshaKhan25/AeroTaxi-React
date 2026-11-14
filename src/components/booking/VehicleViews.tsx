import { Briefcase, Check, ChevronRight, ShoppingBag, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCurrency } from '@/lib/format';
import { Badge } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import type { Vehicle } from '@/types';

/** Compact card used by the "Choose your ride" carousel on the home page. */
export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <article className="group h-full rounded-2xl border border-transparent bg-cream p-5 transition-all duration-300 hover:border-gray-200 hover:shadow-card-hover">
      <div className="mb-4 flex h-28 items-center justify-center">
        {vehicle.image && (
          <img
            src={vehicle.image}
            alt={vehicle.name}
            loading="lazy"
            className="max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <h3 className="text-base font-bold text-gray-900">{vehicle.name}</h3>
      {vehicle.carModel && (
        <Badge tone="neutral" className="mt-1 text-[10px] font-normal text-gray-500">
          {vehicle.carModel}
        </Badge>
      )}
      {vehicle.description && (
        <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{vehicle.description}</p>
      )}
      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3 text-gray-400" aria-hidden /> {vehicle.passengers}
        </span>
        <span className="flex items-center gap-1">
          <Briefcase className="h-3 w-3 text-gray-400" aria-hidden /> {vehicle.suitcases}
        </span>
      </div>
      <p className="mt-3 text-lg font-bold text-gray-900">From {formatCurrency(vehicle.price)}</p>
    </article>
  );
}

interface VehicleListItemProps {
  vehicle: Vehicle;
  price: number;
  selected: boolean;
  priceLoading?: boolean;
  onSelect: () => void;
}

/** Full-width row used on the "Your ride" step. */
export function VehicleListItem({
  vehicle,
  price,
  selected,
  priceLoading = false,
  onSelect,
}: VehicleListItemProps) {
  return (
    <article
      className={cn(
        'flex flex-col items-start gap-5 py-6 sm:flex-row',
        selected && 'rounded-2xl bg-accent-50/50 px-3 sm:px-4',
      )}
    >
      <div className="flex h-32 w-full flex-shrink-0 items-center justify-center sm:w-48">
        <img
          src={vehicle.image}
          alt={vehicle.name}
          loading="lazy"
          className="max-h-full max-w-full object-contain"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-bold text-gray-900">{vehicle.name}</h3>
          {vehicle.carModel && <Badge tone="neutral">{vehicle.carModel}</Badge>}
        </div>

        {vehicle.description && (
          <p className="mb-3 text-sm text-gray-500">{vehicle.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-gray-400" aria-hidden />
            {vehicle.passengers}
          </span>
          <span className="flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-gray-400" aria-hidden />
            {vehicle.suitcases}
          </span>
          <span className="flex items-center gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5 text-gray-400" aria-hidden />
            {vehicle.suitcases}
          </span>
          {vehicle.handLuggageNote && (
            <span className="text-xs text-gray-400">{vehicle.handLuggageNote}</span>
          )}
        </div>
      </div>

      <div className="flex w-full flex-shrink-0 items-center justify-between gap-4 sm:w-auto sm:flex-col sm:items-end sm:gap-3">
        <p
          className={cn(
            'text-2xl font-bold text-gray-900 transition-opacity',
            priceLoading && 'opacity-50',
          )}
        >
          {formatCurrency(price)}
        </p>
        <Button
          onClick={onSelect}
          variant="primary"
          className={cn('border-2 border-accent', selected && 'bg-accent-300')}
          aria-pressed={selected}
        >
          {selected ? (
            <>
              <Check className="h-4 w-4" aria-hidden /> Selected
            </>
          ) : (
            <>
              Select <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </>
          )}
        </Button>
      </div>
    </article>
  );
}

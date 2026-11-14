import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MapPin, Plane, PlaneTakeoff, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import { searchPlaces } from '@/lib/geo';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import type { PlaceSuggestion } from '@/types';

interface Suggestions {
  airports: PlaceSuggestion[];
  addresses: PlaceSuggestion[];
}

const EMPTY: Suggestions = { airports: [], addresses: [] };

async function loadSuggestions(query: string, signal?: AbortSignal): Promise<Suggestions> {
  const trimmed = query.trim();

  const airportsPromise = api
    .searchAirports(trimmed, trimmed ? 6 : 8)
    .then((airports) =>
      airports.map<PlaceSuggestion>((airport) => ({
        kind: 'airport',
        value: `${airport.name} (${airport.code})`,
        label: airport.name,
        sublabel: airport.city,
        code: airport.code,
      })),
    )
    .catch(() => []);

  const addressesPromise = trimmed
    ? searchPlaces(trimmed, signal).then((places) =>
        places.map<PlaceSuggestion>((place) => ({
          kind: 'address',
          value: place.display_name,
          label: place.display_name,
          lat: Number.parseFloat(place.lat),
          lon: Number.parseFloat(place.lon),
        })),
      )
    : Promise.resolve<PlaceSuggestion[]>([]);

  const [airports, addresses] = await Promise.all([airportsPromise, addressesPromise]);
  return { airports, addresses };
}

export interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: PlaceSuggestion) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  size?: 'md' | 'sm';
  clearable?: boolean;
  required?: boolean;
  invalid?: boolean;
  name?: string;
  id?: string;
  ariaLabel?: string;
  className?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Where to?',
  icon,
  size = 'md',
  clearable = false,
  required = false,
  invalid = false,
  name,
  id,
  ariaLabel,
  className,
}: LocationAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  /** Tracks what the user typed, so selecting a value does not re-open the list. */
  const [query, setQuery] = useState(value);
  const listboxId = `${useId()}-listbox`;

  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const { data = EMPTY, isFetching } = useQuery({
    queryKey: ['places', debouncedQuery.trim().toLowerCase()],
    queryFn: ({ signal }) => loadSuggestions(debouncedQuery, signal),
    enabled: open,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
  });

  const flat = useMemo(() => [...data.airports, ...data.addresses], [data]);

  const close = useCallback(() => {
    setOpen(false);
    setHighlight(-1);
  }, []);

  useClickOutside(containerRef, close, open);

  const choose = useCallback(
    (suggestion: PlaceSuggestion) => {
      onChange(suggestion.value);
      setQuery(suggestion.value);
      onSelect?.(suggestion);
      close();
    },
    [close, onChange, onSelect],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      close();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (!flat.length) return;
      setHighlight((current) => {
        if (event.key === 'ArrowDown') return (current + 1) % flat.length;
        return current <= 0 ? flat.length - 1 : current - 1;
      });
      return;
    }

    if (event.key === 'Enter' && open && highlight >= 0 && flat[highlight]) {
      event.preventDefault();
      choose(flat[highlight]);
    }
  };

  const showList = open && flat.length > 0;
  const inputSize = size === 'sm' ? 'py-2.5 pl-9 text-sm' : 'py-3.5 pl-10';

  const renderOption = (suggestion: PlaceSuggestion, index: number) => {
    const active = highlight === index;
    return (
      <li key={`${suggestion.kind}-${suggestion.value}-${index}`} role="presentation">
        <button
          type="button"
          role="option"
          aria-selected={active}
          onMouseEnter={() => setHighlight(index)}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => choose(suggestion)}
          className={cn(
            'flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors',
            active ? 'bg-accent-50' : 'hover:bg-accent-50',
          )}
        >
          <span
            className={cn(
              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
              suggestion.kind === 'airport' ? 'bg-primary-50 text-primary-700' : 'bg-gray-100 text-gray-400',
            )}
          >
            {suggestion.kind === 'airport' ? (
              <PlaneTakeoff className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <MapPin className="h-3.5 w-3.5" aria-hidden />
            )}
          </span>
          <span className="min-w-0 flex-1">
            {suggestion.kind === 'airport' ? (
              <>
                <span className="text-sm font-medium text-gray-800">{suggestion.label}</span>
                {suggestion.code && (
                  <span className="ml-1 text-xs text-gray-400">({suggestion.code})</span>
                )}
                {suggestion.sublabel && (
                  <span className="block text-xs text-gray-400">{suggestion.sublabel}</span>
                )}
              </>
            ) : (
              <span className="line-clamp-2 text-sm text-gray-700">{suggestion.label}</span>
            )}
          </span>
        </button>
      </li>
    );
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        {icon && (
          <span
            className={cn(
              'pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-400',
              size === 'sm' ? 'left-3' : 'left-3.5',
            )}
          >
            {icon}
          </span>
        )}
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-label={ariaLabel}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          required={required}
          placeholder={placeholder}
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            onChange(event.target.value);
            setQuery(event.target.value);
            setHighlight(-1);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            'field',
            inputSize,
            invalid && 'field-error',
            (isFetching || (clearable && value)) && (size === 'sm' ? 'pr-16' : 'pr-10'),
          )}
        />

        <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
          {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" aria-hidden />}
          {clearable && value.length > 0 && (
            <button
              type="button"
              aria-label="Clear location"
              onClick={() => {
                onChange('');
                setQuery('');
                close();
                inputRef.current?.focus();
              }}
              className="rounded-md p-0.5 text-gray-300 transition hover:bg-gray-100 hover:text-gray-500"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </span>
      </div>

      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-[60] mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-card-hover animate-slide-down"
        >
          {data.airports.length > 0 && (
            <>
              <li
                role="presentation"
                className="flex items-center gap-1.5 bg-gray-50 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400"
              >
                <Plane className="h-3 w-3" aria-hidden /> Airports
              </li>
              {data.airports.map((suggestion, index) => renderOption(suggestion, index))}
            </>
          )}

          {data.addresses.length > 0 && (
            <>
              <li
                role="presentation"
                className="flex items-center gap-1.5 bg-gray-50 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400"
              >
                <MapPin className="h-3 w-3" aria-hidden /> Addresses
              </li>
              {data.addresses.map((suggestion, index) =>
                renderOption(suggestion, data.airports.length + index),
              )}
            </>
          )}
        </ul>
      )}
    </div>
  );
}

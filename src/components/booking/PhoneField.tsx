import { useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { COUNTRIES, type Country, filterCountries } from '@/lib/countries';
import { useClickOutside } from '@/hooks/useClickOutside';

interface PhoneFieldProps {
  country: Country;
  onCountryChange: (country: Country) => void;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
  required?: boolean;
}

/** Dial-code picker with search, paired with the phone-number input. */
export function PhoneField({
  country,
  onCountryChange,
  value,
  onChange,
  invalid = false,
  placeholder = 'Phone*',
  id,
  name,
  required,
}: PhoneFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useClickOutside(containerRef, () => setOpen(false), open);

  const results = useMemo(() => filterCountries(query), [query]);

  return (
    <div className="flex gap-2">
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setOpen((current) => !current);
            setQuery('');
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Dialling code, currently +${country.code} (${country.name})`}
          className="flex h-full cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-700 transition hover:bg-gray-100"
        >
          <span className="text-base" aria-hidden>
            {country.flag}
          </span>
          <span className="font-medium">+{country.code}</span>
          <ChevronDown className="h-3 w-3 text-gray-400" aria-hidden />
        </button>

        {open && (
          <div
            role="listbox"
            className="absolute left-0 top-full z-[70] mt-1.5 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card-hover animate-slide-down"
          >
            <div className="border-b border-gray-100 p-2">
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search country…"
                aria-label="Search countries"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {results.length === 0 && (
                <p className="px-3 py-4 text-center text-xs text-gray-400">No countries found</p>
              )}
              {results.map((item) => (
                <button
                  key={item.iso}
                  type="button"
                  role="option"
                  aria-selected={item.iso === country.iso}
                  onClick={() => {
                    onCountryChange(item);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                    item.iso === country.iso ? 'bg-accent-50' : 'hover:bg-gray-50',
                  )}
                >
                  <span className="text-base" aria-hidden>
                    {item.flag}
                  </span>
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="text-xs text-gray-400">+{item.code}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <input
        id={id}
        name={name}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid || undefined}
        className={cn('field flex-1', invalid && 'field-error')}
      />
    </div>
  );
}

export { COUNTRIES };

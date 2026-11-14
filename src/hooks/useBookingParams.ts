import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface BookingParams {
  from: string;
  to: string;
  /** `YYYY-MM-DD` or empty. */
  date: string;
  /** `HH:MM` or empty. */
  time: string;
  vehicleId: number | null;
  price: number | null;
  distance: string;
  duration: string;
}

const PARAM_KEYS = {
  from: 'from',
  to: 'to',
  date: 'date',
  time: 'time',
  vehicleId: 'vehicle',
  price: 'price',
  distance: 'distance',
  duration: 'duration',
} as const;

export function buildBookingSearch(params: Partial<BookingParams>): string {
  const search = new URLSearchParams();
  const set = (key: string, value: string | number | null | undefined) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  };

  set(PARAM_KEYS.from, params.from);
  set(PARAM_KEYS.to, params.to);
  set(PARAM_KEYS.date, params.date);
  set(PARAM_KEYS.time, params.time);
  set(PARAM_KEYS.vehicleId, params.vehicleId ?? null);
  set(PARAM_KEYS.price, params.price !== null && params.price !== undefined ? params.price.toFixed(2) : null);
  set(PARAM_KEYS.distance, params.distance);
  set(PARAM_KEYS.duration, params.duration);

  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/** Reads the booking flow state out of the URL, which keeps steps shareable. */
export function useBookingParams(): BookingParams {
  const [searchParams] = useSearchParams();

  return useMemo(() => {
    const number = (raw: string | null): number | null => {
      if (!raw) return null;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    };

    return {
      from: searchParams.get(PARAM_KEYS.from)?.trim() ?? '',
      to: searchParams.get(PARAM_KEYS.to)?.trim() ?? '',
      date: searchParams.get(PARAM_KEYS.date)?.trim() ?? '',
      time: searchParams.get(PARAM_KEYS.time)?.trim() ?? '',
      vehicleId: number(searchParams.get(PARAM_KEYS.vehicleId)),
      price: number(searchParams.get(PARAM_KEYS.price)),
      distance: searchParams.get(PARAM_KEYS.distance)?.trim() ?? '',
      duration: searchParams.get(PARAM_KEYS.duration)?.trim() ?? '',
    };
  }, [searchParams]);
}

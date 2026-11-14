const GBP = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (value: number | string | null | undefined): string =>
  GBP.format(Number(value ?? 0) || 0);

/** `34.00` — the bare amount, for places that render their own £ sign. */
export const formatAmount = (value: number | string | null | undefined): string =>
  (Number(value ?? 0) || 0).toFixed(2);

export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const WEEKDAYS_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;
export const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/**
 * Parses `YYYY-MM-DD` into a local-midnight Date, avoiding the UTC shift that
 * `new Date('2026-01-01')` introduces.
 */
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

export const toDateOnly = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;

/** "Sat, 20 Dec 2026" */
export function formatShortDate(value: string | null | undefined): string {
  const date = parseDateOnly(value);
  if (!date) return '';
  return `${WEEKDAYS_SHORT[date.getDay()]}, ${date.getDate()} ${MONTHS_LONG[date.getMonth()].slice(
    0,
    3,
  )} ${date.getFullYear()}`;
}

/** "Saturday, 20 December 2026" */
export function formatLongDate(value: string | null | undefined): string {
  const date = parseDateOnly(value);
  if (!date) return '';
  return `${WEEKDAYS_LONG[date.getDay()]}, ${date.getDate()} ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

/** "Saturday | 20 Dec 2026 | 08:30" — the journey-card style of the original. */
export function formatJourneyDate(
  value: string | null | undefined,
  time?: string | null,
): { weekday: string; date: string; time: string | null } | null {
  const date = parseDateOnly(value);
  if (!date) return null;
  return {
    weekday: WEEKDAYS_LONG[date.getDay()],
    date: `${date.getDate()} ${MONTHS_LONG[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`,
    time: time ?? null,
  };
}

/** "20 Dec 2026, 14:05" from an ISO timestamp. */
export function formatTimestamp(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())} ${MONTHS_LONG[date.getMonth()].slice(0, 3)} ${date.getFullYear()}, ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function formatDateOnlyFromIso(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())} ${MONTHS_LONG[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`;
}

/** "3 minutes ago", "in 2 days" */
export function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ];

  const formatter = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' });
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      return formatter.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return formatter.format(diffSeconds, 'second');
}

export const titleCase = (value: string | null | undefined): string => {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

/** Human duration from seconds: "3h 25m" / "45m". */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export const pluralise = (count: number, singular: string, plural = `${singular}s`): string =>
  `${count} ${count === 1 ? singular : plural}`;

/** Trims long OSM display names down to something that fits a card. */
export function shortenPlace(value: string, maxParts = 3): string {
  const parts = value.split(',').map((part) => part.trim());
  if (parts.length <= maxParts) return value;
  return parts.slice(0, maxParts).join(', ');
}

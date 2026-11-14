import type { Vehicle } from '@/types';

/**
 * Median fares observed at key distances, carried over verbatim from the
 * original site. Prices are interpolated between rows and extrapolated beyond
 * the last row using the final gradient.
 *
 * Columns: [miles, saloon, estate, executive, people-carrier,
 *           executive-people-carrier, minibus, 16pax]
 */
const PRICING_TABLE: readonly (readonly number[])[] = [
  [3, 34, 39, 45, 45, 64, 67, 155],
  [5, 38, 42, 48, 48, 66, 70, 155],
  [8, 52, 58, 68, 68, 93, 98, 198],
  [10, 60, 68, 78, 78, 106, 112, 228],
  [13, 72, 82, 95, 95, 130, 136, 280],
  [15, 82, 93, 108, 108, 148, 155, 310],
  [18, 88, 100, 115, 115, 158, 150, 305],
  [20, 92, 105, 120, 120, 165, 155, 315],
  [25, 97, 111, 130, 130, 178, 158, 325],
  [30, 102, 117, 137, 137, 188, 162, 332],
  [35, 108, 124, 145, 145, 198, 165, 338],
  [40, 113, 130, 152, 152, 210, 168, 345],
  [50, 124, 143, 167, 167, 231, 184, 372],
  [60, 133, 153, 179, 179, 248, 196, 396],
  [70, 142, 162, 190, 190, 264, 209, 422],
  [80, 152, 175, 206, 206, 285, 225, 455],
  [100, 178, 205, 242, 242, 335, 265, 535],
] as const;

/** Vehicle slug → column index in `PRICING_TABLE`. */
const COLUMN_BY_SLUG: Record<string, number> = {
  saloon: 1,
  estate: 2,
  executive: 3,
  'people-carrier': 4,
  'executive-people-carrier': 5,
  minibus: 6,
  '16pax': 7,
};

/**
 * Fare for a vehicle over a journey of `miles`.
 * With no route calculated yet (`miles <= 0`) the vehicle's "from" price is
 * returned, matching the placeholder prices shown before a route is known.
 */
export function calculateVehiclePrice(vehicle: Vehicle, miles: number): number {
  const column = COLUMN_BY_SLUG[vehicle.slug];
  if (!miles || miles <= 0 || column === undefined) {
    return Math.round(vehicle.price * 100) / 100;
  }

  const first = PRICING_TABLE[0];
  const last = PRICING_TABLE[PRICING_TABLE.length - 1];
  const secondToLast = PRICING_TABLE[PRICING_TABLE.length - 2];

  if (miles <= first[0]) return first[column];

  if (miles >= last[0]) {
    const gradient = (last[column] - secondToLast[column]) / (last[0] - secondToLast[0]);
    return Math.round(last[column] + gradient * (miles - last[0]));
  }

  for (let index = 0; index < PRICING_TABLE.length - 1; index += 1) {
    const low = PRICING_TABLE[index];
    const high = PRICING_TABLE[index + 1];
    if (miles >= low[0] && miles < high[0]) {
      const fraction = (miles - low[0]) / (high[0] - low[0]);
      return Math.round(low[column] + fraction * (high[column] - low[column]));
    }
  }

  return Math.round(vehicle.price * 100) / 100;
}

/** Optional extras offered on the transfer-details step. */
export interface ExtraOption {
  id: string;
  label: string;
  description?: string;
  price: number;
  /** Grouped extras (child seats) render as a nested list. */
  group?: 'child-seat';
}

export const MEET_AND_GREET_PRICE = 10;

export const EXTRA_OPTIONS: readonly ExtraOption[] = [
  {
    id: 'meet-greet',
    label: 'Meet & Greet',
    description:
      'Your driver will greet you with your name on a sign at the airport terminal arrivals hall',
    price: MEET_AND_GREET_PRICE,
  },
  {
    id: 'child-seat-baby',
    label: 'Baby seat (0-1y, 0-13kg)',
    price: 0,
    group: 'child-seat',
  },
  {
    id: 'child-seat-toddler',
    label: 'Toddler seat (1-4y, 9-18kg)',
    price: 0,
    group: 'child-seat',
  },
  {
    id: 'child-seat-child',
    label: 'Child seat (3-7y, 15-25kg)',
    price: 0,
    group: 'child-seat',
  },
  {
    id: 'child-seat-booster',
    label: 'Booster seat (6-12y, 22-36kg)',
    price: 0,
    group: 'child-seat',
  },
  {
    id: 'pet',
    label: 'Pet',
    description: 'Bring your furry friend with you in a pet carrier or leash',
    price: 0,
  },
  {
    id: 'oversized',
    label: 'Oversized item',
    description: 'Including a child buggy/golf bag/ski gear',
    price: 0,
  },
] as const;

export const extrasTotal = (selectedIds: readonly string[]): number =>
  EXTRA_OPTIONS.filter((option) => selectedIds.includes(option.id)).reduce(
    (sum, option) => sum + option.price,
    0,
  );

export const extrasPayload = (
  selectedIds: readonly string[],
): { id: string; label: string; price: number }[] =>
  EXTRA_OPTIONS.filter((option) => selectedIds.includes(option.id)).map((option) => ({
    id: option.id,
    label: option.label,
    price: option.price,
  }));

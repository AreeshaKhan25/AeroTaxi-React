import type { Coordinates, RouteResult } from '@/types';
import { formatDuration } from './format';

/** Thrown when a journey has both ends filled in but one cannot be located. */
export class GeocodeError extends Error {
  constructor(readonly query: string) {
    super(`Could not locate "${query}"`);
    this.name = 'GeocodeError';
  }
}

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const OSRM = 'https://router.project-osrm.org/route/v1/driving';

/** Local-roads allowance added to the road distance, as on the original site. */
const DISTANCE_ALLOWANCE_MILES = 1.5;
const METRES_PER_MILE = 1609.344;

export interface NominatimPlace {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
}

const geocodeCache = new Map<string, Coordinates | null>();
const searchCache = new Map<string, NominatimPlace[]>();

/**
 * Nominatim's usage policy allows one request per second and throttles callers
 * that ignore it. Geocoding both ends of a journey in parallel is exactly the
 * pattern that trips it, so every call queues behind the last one.
 */
const MIN_REQUEST_GAP_MS = 1100;
let nominatimQueue: Promise<unknown> = Promise.resolve();

function queued<T>(task: () => Promise<T>): Promise<T> {
  const run = nominatimQueue.then(task, task);
  nominatimQueue = run.then(
    () => new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_GAP_MS)),
    () => new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_GAP_MS)),
  );
  return run;
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return (await response.json()) as T;
}

/**
 * The UI labels airports as `London Luton Airport (LTN)`, but Nominatim matches
 * place names and returns nothing for the bracketed code — silently, and only
 * for some airports, which is why this failed inconsistently. Each candidate is
 * tried in turn, widest match last.
 */
export function geocodeCandidates(query: string): string[] {
  const trimmed = query.trim().replace(/\s+/g, ' ');
  if (!trimmed) return [];

  const candidates = [trimmed];

  const withoutCode = trimmed.replace(/\s*\(\s*[A-Za-z]{3}\s*\)\s*$/, '').trim();
  if (withoutCode && withoutCode !== trimmed) candidates.push(withoutCode);

  /* "Terminal 5, London Heathrow Airport" → fall back to the trailing place. */
  const parts = withoutCode.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length > 1) {
    const tail = parts.slice(-2).join(', ');
    if (tail.length > 3 && !candidates.includes(tail)) candidates.push(tail);
  }

  return candidates;
}

/** UK address suggestions from OpenStreetMap. Returns `[]` on any failure. */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
  limit = 5,
): Promise<NominatimPlace[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const key = `${trimmed.toLowerCase()}|${limit}`;
  const cached = searchCache.get(key);
  if (cached) return cached;

  const url = `${NOMINATIM}?format=json&q=${encodeURIComponent(
    trimmed,
  )}&countrycodes=gb&limit=${limit}&addressdetails=1`;

  try {
    const places = await queued(() => fetchJson<NominatimPlace[]>(url, signal));
    searchCache.set(key, places);
    return places;
  } catch {
    return [];
  }
}

/**
 * Resolves a free-text location to coordinates, with an in-memory cache.
 * Falls back through `geocodeCandidates` so a label the UI decorated — an
 * airport code, a terminal prefix — still resolves.
 */
export async function geocode(query: string, signal?: AbortSignal): Promise<Coordinates | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const key = trimmed.toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null;

  for (const candidate of geocodeCandidates(trimmed)) {
    const url = `${NOMINATIM}?format=json&q=${encodeURIComponent(
      candidate,
    )}&countrycodes=gb&limit=1`;

    try {
      const places = await queued(() => fetchJson<NominatimPlace[]>(url, signal));
      const first = places[0];
      if (first) {
        const coordinates = {
          lat: Number.parseFloat(first.lat),
          lon: Number.parseFloat(first.lon),
        };
        geocodeCache.set(key, coordinates);
        return coordinates;
      }
    } catch (error) {
      /* An aborted request is the caller moving on, not a failed lookup. */
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
    }
  }

  /* Cache the miss too, so a bad entry is not retried on every keystroke. */
  geocodeCache.set(key, null);
  return null;
}

interface OsrmResponse {
  routes?: {
    duration: number;
    distance: number;
    geometry: { coordinates: [number, number][] };
  }[];
}

const haversineMiles = (from: Coordinates, to: Coordinates): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(to.lat - from.lat);
  const dLon = toRad(to.lon - from.lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Geocodes both ends, then asks OSRM for a driving route. If OSRM is
 * unavailable the result falls back to a straight line with an estimated
 * distance so pricing still works, flagged via `approximate`.
 */
export async function calculateRoute(
  fromQuery: string,
  toQuery: string,
  signal?: AbortSignal,
): Promise<RouteResult | null> {
  if (!fromQuery?.trim() || !toQuery?.trim()) return null;

  const [from, to] = await Promise.all([geocode(fromQuery, signal), geocode(toQuery, signal)]);
  /*
   * Both ends were supplied, so a miss here is a lookup failure rather than an
   * incomplete journey. Returning null made the map claim the fields were empty.
   */
  if (!from) throw new GeocodeError(fromQuery);
  if (!to) throw new GeocodeError(toQuery);

  const url = `${OSRM}/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`;

  try {
    const data = await fetchJson<OsrmResponse>(url, signal);
    const route = data.routes?.[0];
    if (!route) throw new Error('No route returned');

    const miles = route.distance / METRES_PER_MILE + DISTANCE_ALLOWANCE_MILES;
    return {
      miles,
      distanceLabel: `${miles.toFixed(1)} mi`,
      durationLabel: formatDuration(route.duration),
      durationSeconds: route.duration,
      geometry: route.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]),
      from,
      to,
      approximate: false,
    };
  } catch {
    /* Straight-line estimate: roads are typically ~20% longer than the crow flies. */
    const straight = haversineMiles(from, to);
    const miles = straight * 1.2 + DISTANCE_ALLOWANCE_MILES;
    return {
      miles,
      distanceLabel: `≈ ${miles.toFixed(1)} mi`,
      durationLabel: `≈ ${formatDuration((miles / 40) * 3600)}`,
      durationSeconds: (miles / 40) * 3600,
      geometry: [
        [from.lat, from.lon],
        [to.lat, to.lon],
      ],
      from,
      to,
      approximate: true,
    };
  }
}

import type { Coordinates, RouteResult } from '@/types';
import { formatDuration } from './format';

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

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return (await response.json()) as T;
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
    const places = await fetchJson<NominatimPlace[]>(url, signal);
    searchCache.set(key, places);
    return places;
  } catch {
    return [];
  }
}

/** Resolves a free-text location to coordinates, with an in-memory cache. */
export async function geocode(query: string, signal?: AbortSignal): Promise<Coordinates | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const key = trimmed.toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null;

  const url = `${NOMINATIM}?format=json&q=${encodeURIComponent(trimmed)}&countrycodes=gb&limit=1`;

  try {
    const places = await fetchJson<NominatimPlace[]>(url, signal);
    const first = places[0];
    const coordinates = first
      ? { lat: Number.parseFloat(first.lat), lon: Number.parseFloat(first.lon) }
      : null;
    geocodeCache.set(key, coordinates);
    return coordinates;
  } catch {
    return null;
  }
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
  if (!from || !to) return null;

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

import { useQuery } from '@tanstack/react-query';
import { calculateRoute } from '@/lib/geo';
import type { RouteResult } from '@/types';

/**
 * Geocodes and routes a journey, cached per from/to pair so moving between the
 * booking steps does not re-hit Nominatim and OSRM.
 */
export function useRoute(from: string | null | undefined, to: string | null | undefined) {
  const fromKey = (from ?? '').trim();
  const toKey = (to ?? '').trim();
  const enabled = fromKey.length > 2 && toKey.length > 2;

  return useQuery<RouteResult | null>({
    queryKey: ['route', fromKey.toLowerCase(), toKey.toLowerCase()],
    enabled,
    queryFn: ({ signal }) => calculateRoute(fromKey, toKey, signal),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });
}

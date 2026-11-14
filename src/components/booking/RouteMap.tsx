import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import { Loader2, MapPinned } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { RouteResult } from '@/types';

const UK_CENTRE: [number, number] = [53.5, -2.2];

const dot = (colour: string) =>
  L.divIcon({
    className: '',
    html: `<span style="display:block;width:14px;height:14px;border-radius:50%;background:${colour};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

const START_ICON = dot('#0C6291');
const END_ICON = dot('#dc2626');

/** Keeps the viewport on the current route, and resizes with its container. */
function MapViewport({ route }: { route: RouteResult | null }) {
  const map = useMap();

  useEffect(() => {
    /* Leaflet measures 0×0 if it mounts inside a layout that is still settling. */
    const timer = window.setTimeout(() => map.invalidateSize(), 150);
    return () => window.clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  useEffect(() => {
    if (!route || route.geometry.length === 0) {
      map.setView(UK_CENTRE, 6);
      return;
    }
    map.fitBounds(L.latLngBounds(route.geometry).pad(0.15), { animate: true });
  }, [map, route]);

  return null;
}

export interface RouteMapProps {
  route: RouteResult | null | undefined;
  loading?: boolean;
  heading?: string;
  height?: string;
  className?: string;
}

export function RouteMap({
  route,
  loading = false,
  heading = 'Map view',
  height = 'h-52',
  className,
}: RouteMapProps) {
  const polyline = useMemo(() => route?.geometry ?? [], [route]);

  return (
    <div className={className}>
      {heading && (
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">{heading}</h3>
          {loading && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Calculating…
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          'relative w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100',
          height,
        )}
      >
        <MapContainer
          center={UK_CENTRE}
          zoom={6}
          zoomControl={false}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />
          {route && (
            <>
              <Polyline
                positions={polyline}
                pathOptions={{
                  color: '#2563eb',
                  weight: 4,
                  opacity: 0.85,
                  lineCap: 'round',
                  dashArray: route.approximate ? '8 6' : undefined,
                }}
              />
              <Marker position={[route.from.lat, route.from.lon]} icon={START_ICON} />
              <Marker position={[route.to.lat, route.to.lon]} icon={END_ICON} />
            </>
          )}
          <MapViewport route={route ?? null} />
        </MapContainer>

        {!route && !loading && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/70">
            <p className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <MapPinned className="h-4 w-4" aria-hidden /> Enter both locations to see the route
            </p>
          </div>
        )}
      </div>

      {route?.approximate && (
        <p className="mt-2 text-xs text-amber-600">
          Live routing is unavailable right now, so the distance shown is an estimate.
        </p>
      )}
    </div>
  );
}

export function RouteMetrics({
  route,
  loading,
  fallbackDistance,
  fallbackDuration,
  className,
}: {
  route?: RouteResult | null;
  loading?: boolean;
  fallbackDistance?: string | null;
  fallbackDuration?: string | null;
  className?: string;
}) {
  const duration = route?.durationLabel ?? fallbackDuration;
  const distance = route?.distanceLabel ?? fallbackDistance;

  return (
    <dl className={cn('flex gap-6', className)}>
      <div>
        <dt className="mb-0.5 text-xs text-gray-400">Estimated duration</dt>
        <dd className="text-base font-bold text-gray-900">
          {loading ? '…' : duration || '—'}
        </dd>
      </div>
      <div>
        <dt className="mb-0.5 text-xs text-gray-400">Distance</dt>
        <dd className="text-base font-bold text-gray-900">{loading ? '…' : distance || '—'}</dd>
      </div>
    </dl>
  );
}

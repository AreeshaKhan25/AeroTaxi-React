import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import L from 'leaflet';
import {
  CircleMarker,
  MapContainer,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { Check, Hexagon, Pencil, Trash2, Undo2, X } from 'lucide-react';
import {
  AdminButton,
  AdminError,
  AdminInput,
  AdminSpinner,
} from '@/components/admin/AdminUi';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ApiError, adminApi } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { Zone } from '@/types';

const LONDON: [number, number] = [51.5074, -0.1278];

const PALETTE = ['#f59e0b', '#0C6291', '#16a34a', '#db2777', '#7c3aed', '#dc2626'];

/** Collects polygon vertices from map clicks while drawing is active. */
function DrawCapture({
  active,
  onPoint,
}: {
  active: boolean;
  onPoint: (point: [number, number]) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    container.style.cursor = active ? 'crosshair' : '';
    return () => {
      container.style.cursor = '';
    };
  }, [map, active]);

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 200);
    return () => window.clearTimeout(timer);
  }, [map]);

  useMapEvents({
    click(event) {
      if (!active) return;
      onPoint([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

/** Fits the map around every saved zone the first time they load. */
function FitZones({ zones }: { zones: Zone[] }) {
  const map = useMap();

  useEffect(() => {
    const points = zones.flatMap((zone) => zone.geometry);
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points).pad(0.2), { animate: false });
  }, [map, zones]);

  return null;
}

export default function AdminZonesPage() {
  usePageTitle('Zones map');
  const queryClient = useQueryClient();

  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState<[number, number][]>([]);
  const [name, setName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: zones, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'zones'],
    queryFn: adminApi.zones,
  });

  const colour = useMemo(() => PALETTE[(zones?.length ?? 0) % PALETTE.length], [zones?.length]);

  const createZone = useMutation({
    mutationFn: () =>
      adminApi.createZone({ name: name.trim(), colour, geometry: points }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'zones'] });
      cancelDrawing();
    },
    onError: (createError) => {
      setFormError(
        createError instanceof ApiError
          ? Object.values(createError.errors)[0] ?? createError.message
          : 'The zone could not be saved.',
      );
    },
  });

  const deleteZone = useMutation({
    mutationFn: (id: number) => adminApi.deleteZone(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'zones'] }),
  });

  function cancelDrawing() {
    setDrawing(false);
    setPoints([]);
    setName('');
    setFormError(null);
  }

  if (isLoading) return <AdminSpinner label="Loading zones…" />;
  if (isError || !zones) {
    return <AdminError message={error instanceof Error ? error.message : undefined} />;
  }

  const canSave = points.length >= 3 && name.trim().length > 0;

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-7.5rem)] lg:flex-row">
      {/* Map */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-bold text-gray-900">Zones Map</h1>
          <div className="flex items-center gap-2">
            {drawing ? (
              <>
                <AdminButton
                  size="sm"
                  variant="ghost"
                  onClick={() => setPoints((current) => current.slice(0, -1))}
                  disabled={points.length === 0}
                >
                  <Undo2 className="h-3.5 w-3.5" aria-hidden /> Undo point
                </AdminButton>
                <AdminButton size="sm" variant="ghost" onClick={cancelDrawing}>
                  <X className="h-3.5 w-3.5" aria-hidden /> Cancel
                </AdminButton>
              </>
            ) : (
              <AdminButton size="sm" onClick={() => setDrawing(true)}>
                <Pencil className="h-3.5 w-3.5" aria-hidden /> Draw zone
              </AdminButton>
            )}
          </div>
        </div>

        <div className="relative h-[60vh] overflow-hidden rounded-lg border border-gray-200 shadow-sm lg:h-auto lg:flex-1">
          <MapContainer center={LONDON} zoom={10} className="h-full w-full">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
              maxZoom={19}
            />

            {zones.map((zone) => (
              <Polygon
                key={zone.id}
                positions={zone.geometry}
                pathOptions={{
                  color: zone.colour,
                  fillColor: zone.colour,
                  fillOpacity: 0.3,
                  weight: 2,
                }}
              >
                <Tooltip sticky>{zone.name}</Tooltip>
              </Polygon>
            ))}

            {/* The shape currently being drawn */}
            {points.length >= 3 && (
              <Polygon
                positions={points}
                pathOptions={{ color: colour, fillColor: colour, fillOpacity: 0.2, weight: 2, dashArray: '6 4' }}
              />
            )}
            {points.length === 2 && (
              <Polyline positions={points} pathOptions={{ color: colour, weight: 2, dashArray: '6 4' }} />
            )}
            {points.map((point, index) => (
              <CircleMarker
                // eslint-disable-next-line react/no-array-index-key
                key={`${point[0]}-${point[1]}-${index}`}
                center={point}
                radius={5}
                pathOptions={{ color: '#fff', weight: 2, fillColor: colour, fillOpacity: 1 }}
              />
            ))}

            <DrawCapture
              active={drawing}
              onPoint={(point) => setPoints((current) => [...current, point])}
            />
            <FitZones zones={zones} />
          </MapContainer>

          {drawing && (
            <div className="pointer-events-none absolute left-1/2 top-3 z-[500] -translate-x-1/2 rounded-full bg-gray-900/85 px-4 py-1.5 text-xs font-medium text-white shadow-lg">
              Click the map to place corners — {points.length} placed
              {points.length >= 3 ? ' · name it and save' : ', 3 needed'}
            </div>
          )}
        </div>
      </div>

      {/* Side panel */}
      <aside className="w-full flex-shrink-0 space-y-4 lg:w-80 lg:overflow-y-auto">
        {drawing && (
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-gray-900">New zone</h2>
            <div className="space-y-3">
              <AdminInput
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setFormError(null);
                }}
                placeholder="Zone name, e.g. Zone 1 — Central"
                aria-label="Zone name"
              />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span
                  className="h-3.5 w-3.5 rounded-sm border border-white shadow"
                  style={{ backgroundColor: colour }}
                  aria-hidden
                />
                Colour assigned automatically
              </div>
              {formError && <p className="text-xs font-medium text-red-600">{formError}</p>}
              <AdminButton
                className="w-full"
                disabled={!canSave}
                loading={createZone.isPending}
                onClick={() => createZone.mutate()}
              >
                <Check className="h-4 w-4" aria-hidden /> Save zone
              </AdminButton>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-bold text-gray-900">Saved zones</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
              {zones.length}
            </span>
          </header>

          {zones.length === 0 ? (
            <p className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-gray-400">
              <Hexagon className="h-6 w-6 text-gray-300" aria-hidden />
              No zones yet. Draw one on the map to get started.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {zones.map((zone) => (
                <li key={zone.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="h-3.5 w-3.5 flex-shrink-0 rounded-sm"
                    style={{ backgroundColor: zone.colour }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-900">
                      {zone.name}
                    </span>
                    <span className="block text-xs text-gray-400">
                      {zone.geometry.length} corners
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete the zone "${zone.name}"?`)) {
                        deleteZone.mutate(zone.id);
                      }
                    }}
                    disabled={deleteZone.isPending && deleteZone.variables === zone.id}
                    className={cn(
                      'rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600',
                      deleteZone.isPending && deleteZone.variables === zone.id && 'opacity-50',
                    )}
                    aria-label={`Delete ${zone.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

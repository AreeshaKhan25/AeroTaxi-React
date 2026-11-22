import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Info } from 'lucide-react';
import { StepProgress } from '@/components/booking/StepProgress';
import { BookingSearchForm, type JourneySelection } from '@/components/booking/BookingSearchForm';
import { RouteMap, RouteMetrics } from '@/components/booking/RouteMap';
import { VehicleListItem } from '@/components/booking/VehicleViews';
import { Button } from '@/components/ui/Button';
import { Alert, Skeleton } from '@/components/ui/Surface';
import { buildBookingSearch, useBookingParams } from '@/hooks/useBookingParams';
import { useVehicles } from '@/hooks/useCatalog';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRoute } from '@/hooks/useRoute';
import { formatCurrency } from '@/lib/format';
import { calculateVehiclePrice } from '@/lib/pricing';
import { ROUTES } from '@/lib/site';

export default function YourRidePage() {
  usePageTitle('Your ride');
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const params = useBookingParams();

  const [journey, setJourney] = useState<JourneySelection>({
    from: params.from,
    to: params.to,
    date: params.date,
    time: params.time,
  });
  const [selectedId, setSelectedId] = useState<number | null>(params.vehicleId);

  /* Keep the URL in step with sidebar edits so the page stays shareable. */
  useEffect(() => {
    const next = buildBookingSearch({ ...journey, vehicleId: selectedId }).replace(/^\?/, '');
    setSearchParams(new URLSearchParams(next), { replace: true });
  }, [journey, selectedId, setSearchParams]);

  const vehicles = useVehicles();
  const route = useRoute(journey.from, journey.to);

  const miles = route.data?.miles ?? 0;

  const pricedVehicles = useMemo(
    () =>
      (vehicles.data ?? []).map((vehicle) => ({
        vehicle,
        price: calculateVehiclePrice(vehicle, miles),
      })),
    [vehicles.data, miles],
  );

  const selected = pricedVehicles.find((entry) => entry.vehicle.id === selectedId) ?? null;

  const missingJourney = !journey.from.trim() || !journey.to.trim() || !journey.date;

  const goToTransferDetails = () => {
    if (!selected) return;

    navigate({
      pathname: ROUTES.transferDetails,
      search: buildBookingSearch({
        ...journey,
        vehicleId: selected.vehicle.id,
        price: selected.price,
        distance: route.data?.distanceLabel ?? '',
        duration: route.data?.durationLabel ?? '',
      }),
    });
  };

  return (
    <div className="min-h-screen bg-white pb-28">
      <StepProgress current={1} />

      <div className="container-narrow py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar */}
          <div className="w-full flex-shrink-0 lg:w-[400px]">
            <div className="space-y-5 lg:sticky lg:top-24">
              <h2 className="text-xl font-bold text-gray-900">Your journey</h2>

              <BookingSearchForm variant="compact" value={journey} onChange={setJourney} />

              <RouteMap
                route={route.data}
                loading={route.isFetching}
                error={route.error}
                hasJourney={Boolean(journey.from.trim() && journey.to.trim())}
              />

              <RouteMetrics route={route.data} loading={route.isFetching} />

              {route.isFetched && !route.data && !missingJourney && (
                <Alert tone="warning" icon={<Info className="h-4 w-4" aria-hidden />}>
                  We could not locate one of those places. Try picking a suggestion from the list.
                </Alert>
              )}
            </div>
          </div>

          {/* Vehicle list */}
          <div className="min-w-0 flex-1">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 lg:text-3xl">Your ride</h1>
            <p className="mb-6 text-sm text-gray-500">
              {miles > 0
                ? `Prices below are for your ${route.data?.distanceLabel} journey, all inclusive.`
                : 'Enter your pickup and drop-off points to see exact prices for your journey.'}
            </p>

            {vehicles.isLoading && (
              <div className="space-y-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <Skeleton key={index} className="h-40 w-full" />
                ))}
              </div>
            )}

            {vehicles.isError && (
              <Alert tone="danger" title="We could not load the fleet">
                Please refresh the page to try again.
              </Alert>
            )}

            <div className="divide-y divide-gray-100">
              {pricedVehicles.map(({ vehicle, price }) => (
                <VehicleListItem
                  key={vehicle.id}
                  vehicle={vehicle}
                  price={price}
                  priceLoading={route.isFetching}
                  selected={selectedId === vehicle.id}
                  onSelect={() => setSelectedId(vehicle.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky selection bar */}
      {selected && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white shadow-bar animate-slide-up-bar">
          <div className="container-narrow py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <img
                  src={selected.vehicle.image}
                  alt=""
                  aria-hidden
                  className="hidden h-12 w-16 object-contain sm:block"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm text-gray-500">
                    Selected:{' '}
                    <span className="font-semibold text-gray-900">{selected.vehicle.name}</span>
                  </p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(selected.price)}</p>
                </div>
              </div>

              <div className="flex flex-shrink-0 flex-col items-end gap-1">
                <Button size="lg" onClick={goToTransferDetails} disabled={missingJourney}>
                  Continue <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
                {missingJourney && (
                  <p className="text-[11px] text-amber-600">
                    Add your route and departure time first
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

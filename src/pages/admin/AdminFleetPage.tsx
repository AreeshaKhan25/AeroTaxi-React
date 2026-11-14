import { useQuery } from '@tanstack/react-query';
import { Briefcase, Users } from 'lucide-react';
import { AdminError, AdminSpinner, PageTitle } from '@/components/admin/AdminUi';
import { usePageTitle } from '@/hooks/usePageTitle';
import { adminApi } from '@/lib/api';
import { formatCurrency, pluralise } from '@/lib/format';

export default function AdminFleetPage() {
  usePageTitle('Fleet');

  const { data: vehicles, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'fleet'],
    queryFn: adminApi.fleet,
  });

  if (isLoading) return <AdminSpinner label="Loading fleet…" />;
  if (isError || !vehicles) {
    return <AdminError message={error instanceof Error ? error.message : undefined} />;
  }

  return (
    <>
      <PageTitle title="Fleet" meta={pluralise(vehicles.length, 'vehicle')} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <article
            key={vehicle.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="flex h-44 items-center justify-center bg-gray-50 p-8">
              <img
                src={vehicle.image}
                alt={vehicle.name}
                loading="lazy"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="p-6">
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="text-lg font-bold text-gray-900">{vehicle.name}</h3>
                <span className="flex-shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                  Active
                </span>
              </div>

              {vehicle.carModel && <p className="mb-4 text-sm text-gray-500">{vehicle.carModel}</p>}

              <div className="mb-4 flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-gray-400" aria-hidden /> {vehicle.passengers}
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-gray-400" aria-hidden /> {vehicle.suitcases}
                </span>
                <span className="ml-auto text-xs text-gray-400">
                  {pluralise(vehicle.bookingCount, 'booking')}
                </span>
              </div>

              <dl className="space-y-2 border-t border-gray-100 pt-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Min price</dt>
                  <dd className="font-semibold text-gray-900">{formatCurrency(vehicle.price)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Short rate / mi</dt>
                  <dd className="font-medium text-gray-700">
                    {formatCurrency(vehicle.shortPerMile)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Long rate / mi</dt>
                  <dd className="font-medium text-gray-700">
                    {formatCurrency(vehicle.longPerMile)}
                  </dd>
                </div>
              </dl>

              {vehicle.handLuggageNote && (
                <p className="mt-4 text-xs text-gray-400">{vehicle.handLuggageNote}</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AdminError,
  AdminField,
  AdminInput,
  AdminSelect,
  AdminSpinner,
  PageTitle,
} from '@/components/admin/AdminUi';
import { BookingsTable } from '@/components/admin/BookingsTable';
import { useVehicles } from '@/hooks/useCatalog';
import { usePageTitle } from '@/hooks/usePageTitle';
import { adminApi } from '@/lib/api';
import { formatAmount } from '@/lib/format';

export default function AdminUnpaidPage() {
  usePageTitle('Unpaid bookings');
  const [search, setSearch] = useState('');
  const [carType, setCarType] = useState('');
  const vehicles = useVehicles();

  const { data: bookings, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'bookings', 'unpaid'],
    queryFn: () => adminApi.bookings('unpaid'),
  });

  const filtered = useMemo(() => {
    const list = bookings ?? [];
    const query = search.trim().toLowerCase();

    return list.filter((booking) => {
      if (carType && booking.vehicle?.name !== carType) return false;
      if (query) {
        const haystack = [booking.reference, booking.passengerName, booking.email]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [bookings, search, carType]);

  const outstanding = filtered.reduce((sum, booking) => sum + booking.totalPrice, 0);

  if (isLoading) return <AdminSpinner label="Loading unpaid bookings…" />;
  if (isError) return <AdminError message={error instanceof Error ? error.message : undefined} />;

  return (
    <>
      <PageTitle
        title="Unpaid Bookings"
        meta={`${filtered.length} bookings · £${formatAmount(outstanding)} outstanding`}
      />

      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <AdminField label="Search" className="w-56">
            <AdminInput
              type="search"
              placeholder="Ref, name, email…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </AdminField>
          <AdminField label="Car type" className="w-44">
            <AdminSelect value={carType} onChange={(event) => setCarType(event.target.value)}>
              <option value="">All</option>
              {(vehicles.data ?? []).map((vehicle) => (
                <option key={vehicle.id} value={vehicle.name}>
                  {vehicle.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          {(search || carType) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCarType('');
              }}
              className="pb-2 text-sm text-gray-400 transition hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <BookingsTable bookings={filtered} showPayment={false} empty="No unpaid bookings" />
    </>
  );
}

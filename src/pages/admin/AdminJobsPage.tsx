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

const STATUSES = [
  'new',
  'confirmed',
  'pending',
  'completed',
  'cancelled',
  'assigned',
  'bidding',
] as const;

interface Filters {
  createdFrom: string;
  createdTo: string;
  pickupFrom: string;
  pickupTo: string;
  carType: string;
  status: string;
  search: string;
}

const EMPTY_FILTERS: Filters = {
  createdFrom: '',
  createdTo: '',
  pickupFrom: '',
  pickupTo: '',
  carType: '',
  status: '',
  search: '',
};

export default function AdminJobsPage() {
  usePageTitle('Jobs');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const vehicles = useVehicles();

  const { data: bookings, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'bookings', 'all'],
    queryFn: () => adminApi.bookings('all'),
  });

  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const filtered = useMemo(() => {
    const list = bookings ?? [];
    const query = filters.search.trim().toLowerCase();

    return list.filter((booking) => {
      if (filters.createdFrom && new Date(booking.createdAt) < new Date(filters.createdFrom)) {
        return false;
      }
      if (
        filters.createdTo &&
        new Date(booking.createdAt) > new Date(`${filters.createdTo}T23:59:59`)
      ) {
        return false;
      }
      if (filters.pickupFrom && booking.departDate && booking.departDate < filters.pickupFrom) {
        return false;
      }
      if (filters.pickupTo && booking.departDate && booking.departDate > filters.pickupTo) {
        return false;
      }
      if (filters.carType && booking.vehicle?.name !== filters.carType) return false;
      if (filters.status && booking.status !== filters.status) return false;
      if (query) {
        const haystack = [booking.reference, booking.passengerName, booking.email]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [bookings, filters]);

  const totals = useMemo(() => {
    const list = bookings ?? [];
    return {
      total: list.length,
      confirmed: list.filter((booking) => booking.status === 'confirmed').length,
      pending: list.filter((booking) => booking.status === 'pending').length,
      revenue: list
        .filter((booking) => booking.paymentStatus === 'paid')
        .reduce((sum, booking) => sum + booking.totalPrice, 0),
    };
  }, [bookings]);

  if (isLoading) return <AdminSpinner label="Loading jobs…" />;
  if (isError) return <AdminError message={error instanceof Error ? error.message : undefined} />;

  return (
    <>
      <PageTitle title="Jobs" meta={`${filtered.length} of ${totals.total} bookings shown`} />

      {/* Quick stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: totals.total, className: 'text-gray-900' },
          { label: 'Confirmed', value: totals.confirmed, className: 'text-green-600' },
          { label: 'Pending', value: totals.pending, className: 'text-amber-600' },
          {
            label: 'Revenue',
            value: `£${formatAmount(totals.revenue)}`,
            className: 'text-gray-900',
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-gray-400">{stat.label}</p>
            <p className={`truncate text-xl font-bold ${stat.className}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <AdminField label="Created from" className="w-36">
            <AdminInput
              type="date"
              value={filters.createdFrom}
              onChange={(event) => set('createdFrom', event.target.value)}
            />
          </AdminField>
          <AdminField label="Created to" className="w-36">
            <AdminInput
              type="date"
              value={filters.createdTo}
              onChange={(event) => set('createdTo', event.target.value)}
            />
          </AdminField>
          <AdminField label="Pickup from" className="w-36">
            <AdminInput
              type="date"
              value={filters.pickupFrom}
              onChange={(event) => set('pickupFrom', event.target.value)}
            />
          </AdminField>
          <AdminField label="Pickup to" className="w-36">
            <AdminInput
              type="date"
              value={filters.pickupTo}
              onChange={(event) => set('pickupTo', event.target.value)}
            />
          </AdminField>
          <AdminField label="Car type" className="w-44">
            <AdminSelect
              value={filters.carType}
              onChange={(event) => set('carType', event.target.value)}
            >
              <option value="">All</option>
              {(vehicles.data ?? []).map((vehicle) => (
                <option key={vehicle.id} value={vehicle.name}>
                  {vehicle.name}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Status" className="w-36">
            <AdminSelect
              value={filters.status}
              onChange={(event) => set('status', event.target.value)}
            >
              <option value="">All</option>
              {STATUSES.map((status) => (
                <option key={status} value={status} className="capitalize">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
          <AdminField label="Search" className="w-48">
            <AdminInput
              type="search"
              placeholder="Ref, name, email…"
              value={filters.search}
              onChange={(event) => set('search', event.target.value)}
            />
          </AdminField>
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="pb-2 text-sm text-gray-400 transition hover:text-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      <BookingsTable bookings={filtered} />
    </>
  );
}

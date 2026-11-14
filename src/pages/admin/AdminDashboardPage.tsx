import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, PoundSterling, Ticket } from 'lucide-react';
import {
  AdminCard,
  AdminError,
  AdminSpinner,
  PageTitle,
  PaymentBadge,
  StatCard,
  StatusBadge,
  TableShell,
  Td,
  Th,
} from '@/components/admin/AdminUi';
import { usePageTitle } from '@/hooks/usePageTitle';
import { adminApi } from '@/lib/api';
import { formatAmount, formatCurrency, formatDateOnlyFromIso, formatShortDate } from '@/lib/format';
import { ROUTES } from '@/lib/site';

const STATUS_DOTS: Record<string, string> = {
  confirmed: 'bg-green-500',
  pending: 'bg-amber-500',
  new: 'bg-blue-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
  assigned: 'bg-sky-500',
  bidding: 'bg-yellow-500',
};

export default function AdminDashboardPage() {
  usePageTitle('Admin dashboard');

  const { data: stats, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.stats,
  });

  if (isLoading) return <AdminSpinner label="Loading dashboard…" />;
  if (isError || !stats) {
    return <AdminError message={error instanceof Error ? error.message : undefined} />;
  }

  const maxVehicleCount = Math.max(1, ...stats.byVehicle.map((entry) => entry.count));
  const maxDayRevenue = Math.max(1, ...stats.revenueByDay.map((entry) => entry.revenue));

  return (
    <>
      <PageTitle
        title="Dashboard"
        meta={`${stats.activeSubscribers} active subscribers · ${stats.unreadMessages} unread messages`}
      />

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Bookings"
          value={stats.totalBookings}
          icon={<Ticket className="h-6 w-6" aria-hidden />}
        />
        <StatCard
          label="Total Revenue"
          value={`£${formatAmount(stats.totalRevenue)}`}
          icon={<PoundSterling className="h-6 w-6" aria-hidden />}
          tone="success"
        />
        <StatCard
          label="Today's Bookings"
          value={stats.todayBookings}
          icon={<CalendarDays className="h-6 w-6" aria-hidden />}
          tone="info"
        />
        <StatCard
          label="Pending Bookings"
          value={stats.pendingBookings}
          icon={<Clock className="h-6 w-6" aria-hidden />}
          tone="warning"
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AdminCard title="Bookings by Status">
          {stats.byStatus.length === 0 && <p className="text-sm text-gray-400">No bookings yet.</p>}
          <ul className="space-y-3.5">
            {stats.byStatus.map((entry) => (
              <li key={entry.status} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-3">
                  <span
                    className={`h-3 w-3 rounded-full ${STATUS_DOTS[entry.status] ?? 'bg-gray-400'}`}
                    aria-hidden
                  />
                  <span className="text-sm capitalize text-gray-700">{entry.status}</span>
                </span>
                <span className="text-sm font-bold text-gray-900">{entry.count}</span>
              </li>
            ))}
          </ul>
        </AdminCard>

        <AdminCard title="Bookings by Vehicle">
          {stats.byVehicle.length === 0 && <p className="text-sm text-gray-400">No bookings yet.</p>}
          <ul className="space-y-3.5">
            {stats.byVehicle.map((entry) => (
              <li key={entry.name} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-sm text-gray-700">{entry.name}</span>
                <span className="flex flex-shrink-0 items-center gap-3">
                  <span className="h-2.5 w-24 overflow-hidden rounded-full bg-gray-100">
                    <span
                      className="block h-full rounded-full bg-primary-600"
                      style={{ width: `${Math.min((entry.count / maxVehicleCount) * 100, 100)}%` }}
                    />
                  </span>
                  <span className="w-8 text-right text-sm font-bold text-gray-900">
                    {entry.count}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </AdminCard>

        <AdminCard
          title="Email Subscribers"
          actions={
            <Link
              to={ROUTES.admin.subscribers}
              className="rounded-lg bg-primary-50 px-3 py-1 text-sm font-bold text-primary-700 hover:bg-primary-100"
            >
              {stats.subscribers.length}
            </Link>
          }
          bodyClassName="p-0"
        >
          <div className="max-h-56 overflow-y-auto">
            {stats.subscribers.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">No subscribers yet</p>
            )}
            <ul className="divide-y divide-gray-50">
              {stats.subscribers.slice(0, 40).map((subscriber) => (
                <li key={subscriber.id} className="flex items-center justify-between gap-3 px-6 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-gray-800">{subscriber.email}</span>
                    {subscriber.name && (
                      <span className="block truncate text-xs text-gray-400">{subscriber.name}</span>
                    )}
                  </span>
                  <span className="flex-shrink-0 text-xs text-gray-400">
                    {formatDateOnlyFromIso(subscriber.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </AdminCard>
      </div>

      {stats.revenueByDay.length > 0 && (
        <AdminCard title="Revenue — last 14 days" className="mb-8">
          <div className="flex h-40 items-end gap-1.5">
            {stats.revenueByDay.map((day) => (
              <div key={day.day} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-primary-200 transition-colors group-hover:bg-primary-500"
                    style={{ height: `${Math.max((day.revenue / maxDayRevenue) * 100, 2)}%` }}
                    title={`${day.day}: ${formatCurrency(day.revenue)} from ${day.bookings} bookings`}
                  />
                </div>
                <span className="w-full truncate text-center text-[10px] text-gray-400">
                  {day.day.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Recent Bookings</h2>
        <Link to={ROUTES.admin.jobs} className="text-sm font-medium text-primary-700 hover:underline">
          View all jobs →
        </Link>
      </div>

      <TableShell
        isEmpty={stats.recentBookings.length === 0}
        empty="No bookings yet."
        head={
          <tr>
            <Th>Reference</Th>
            <Th>Passenger</Th>
            <Th>Route</Th>
            <Th>Date</Th>
            <Th>Price</Th>
            <Th>Status</Th>
            <Th>Payment</Th>
          </tr>
        }
      >
        {stats.recentBookings.map((booking) => (
          <tr key={booking.id} className="hover:bg-gray-50">
            <Td className="font-mono font-bold text-gray-900">
              <Link to={ROUTES.admin.booking(booking.id)} className="hover:text-primary-700">
                {booking.reference}
              </Link>
            </Td>
            <Td className="text-gray-700">{booking.passengerName ?? '—'}</Td>
            <Td className="max-w-[250px] truncate text-gray-500">
              {booking.fromLocation} → {booking.toLocation}
            </Td>
            <Td className="whitespace-nowrap text-gray-500">{formatShortDate(booking.departDate)}</Td>
            <Td className="font-semibold text-gray-900">{formatCurrency(booking.totalPrice)}</Td>
            <Td>
              <StatusBadge status={booking.status} />
            </Td>
            <Td>
              <PaymentBadge status={booking.paymentStatus} />
            </Td>
          </tr>
        ))}
      </TableShell>
    </>
  );
}

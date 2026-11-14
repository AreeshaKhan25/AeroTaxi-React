import { Link } from 'react-router-dom';
import { PaymentBadge, StatusBadge, TableShell, Td, Th } from '@/components/admin/AdminUi';
import { formatCurrency, formatTimestamp } from '@/lib/format';
import { ROUTES } from '@/lib/site';
import type { Booking } from '@/types';

export function BookingsTable({
  bookings,
  showPayment = true,
  empty = 'No bookings found',
}: {
  bookings: Booking[];
  showPayment?: boolean;
  empty?: string;
}) {
  return (
    <TableShell
      isEmpty={bookings.length === 0}
      empty={empty}
      head={
        <tr>
          <Th>Created</Th>
          <Th>Reference</Th>
          <Th>Name</Th>
          <Th>Pickup</Th>
          <Th>Route</Th>
          <Th>Car</Th>
          <Th>Price</Th>
          <Th>Status</Th>
          {showPayment && <Th>Payment</Th>}
          <Th />
        </tr>
      }
    >
      {bookings.map((booking) => (
        <tr key={booking.id} className="hover:bg-gray-50/70">
          <Td className="whitespace-nowrap text-gray-500">{formatTimestamp(booking.createdAt)}</Td>
          <Td className="font-mono font-semibold text-gray-900">
            <Link to={ROUTES.admin.booking(booking.id)} className="hover:text-primary-700">
              {booking.reference}
            </Link>
          </Td>
          <Td className="text-gray-700">{booking.passengerName || '—'}</Td>
          <Td className="whitespace-nowrap text-gray-500">
            {booking.departDate
              ? `${booking.departDate}${booking.departTime ? ` ${booking.departTime}` : ''}`
              : '—'}
          </Td>
          <Td className="max-w-[200px] truncate text-gray-500">
            {booking.fromLocation} → {booking.toLocation}
          </Td>
          <Td className="whitespace-nowrap text-xs uppercase text-gray-500">
            {booking.vehicle?.name ?? '—'}
          </Td>
          <Td className="font-semibold text-gray-900">{formatCurrency(booking.totalPrice)}</Td>
          <Td>
            <StatusBadge status={booking.status} />
          </Td>
          {showPayment && (
            <Td>
              <PaymentBadge status={booking.paymentStatus} />
            </Td>
          )}
          <Td>
            <Link
              to={ROUTES.admin.booking(booking.id)}
              className="inline-flex rounded bg-primary-700 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-primary-800"
            >
              Edit
            </Link>
          </Td>
        </tr>
      ))}
    </TableShell>
  );
}

import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import {
  Briefcase,
  CalendarDays,
  CircleCheckBig,
  Clock,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Plane,
  Printer,
  ShoppingBag,
  StickyNote,
  Users,
} from 'lucide-react';
import { Button, ButtonAnchor, ButtonLink } from '@/components/ui/Button';
import { Alert, Badge, Card, Skeleton } from '@/components/ui/Surface';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api } from '@/lib/api';
import { formatCurrency, formatLongDate } from '@/lib/format';
import { ROUTES, SITE } from '@/lib/site';
import type { Booking } from '@/types';

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 py-3">
      <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</dt>
        <dd className="break-words text-sm font-medium text-gray-900">{value || '—'}</dd>
      </div>
    </div>
  );
}

export function BookingSummary({ booking }: { booking: Booking }) {
  const extrasTotal = booking.extras.reduce((sum, extra) => sum + extra.price, 0);

  return (
    <div className="space-y-6">
      {/* Journey */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900">Journey</h2>
          <div className="flex items-center gap-2">
            <Badge tone={booking.status === 'cancelled' ? 'danger' : 'primary'}>
              {booking.status}
            </Badge>
            <Badge tone={booking.paymentStatus === 'paid' ? 'success' : 'warning'}>
              {booking.paymentStatus}
            </Badge>
          </div>
        </div>

        <div className="relative pl-7">
          <span className="absolute left-[7px] top-2 h-[calc(100%-1rem)] w-0.5 bg-gray-200" aria-hidden />
          <div className="relative mb-5">
            <span
              className="absolute -left-7 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary-700 bg-white"
              aria-hidden
            />
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Pick-up</p>
            <p className="font-medium text-gray-900">{booking.fromLocation}</p>
          </div>
          <div className="relative">
            <span
              className="absolute -left-7 top-1.5 h-3.5 w-3.5 rounded-full bg-accent"
              aria-hidden
            />
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Drop-off</p>
            <p className="font-medium text-gray-900">{booking.toLocation}</p>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-2 sm:divide-y-0">
          <DetailRow
            icon={<CalendarDays className="h-4 w-4" aria-hidden />}
            label="Date"
            value={formatLongDate(booking.departDate)}
          />
          <DetailRow
            icon={<Clock className="h-4 w-4" aria-hidden />}
            label="Pick-up time"
            value={booking.departTime ?? 'To be confirmed'}
          />
          {booking.distance && (
            <DetailRow
              icon={<MapPin className="h-4 w-4" aria-hidden />}
              label="Distance"
              value={booking.distance}
            />
          )}
          {booking.duration && (
            <DetailRow
              icon={<Clock className="h-4 w-4" aria-hidden />}
              label="Estimated duration"
              value={booking.duration}
            />
          )}
          {booking.flightNumber && (
            <DetailRow
              icon={<Plane className="h-4 w-4" aria-hidden />}
              label="Flight number"
              value={booking.flightNumber}
            />
          )}
          {booking.noteToDriver && (
            <DetailRow
              icon={<StickyNote className="h-4 w-4" aria-hidden />}
              label="Note to driver"
              value={booking.noteToDriver}
            />
          )}
        </dl>
      </Card>

      {/* Vehicle & passengers */}
      <Card>
        <h2 className="mb-4 text-lg font-bold text-gray-900">Vehicle &amp; passengers</h2>

        <div className="mb-5 flex items-center gap-4">
          {booking.vehicle?.image && (
            <img
              src={booking.vehicle.image}
              alt={booking.vehicle.name}
              className="h-16 w-24 flex-shrink-0 object-contain"
            />
          )}
          <div className="min-w-0">
            <p className="font-bold text-gray-900">{booking.vehicle?.name ?? 'Vehicle'}</p>
            {booking.vehicle?.carModel && (
              <p className="text-sm text-gray-500">{booking.vehicle.carModel}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-5 text-sm text-gray-600">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" aria-hidden /> {booking.passengers} passengers
          </span>
          <span className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-gray-400" aria-hidden /> {booking.suitcases} suitcases
          </span>
          <span className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-gray-400" aria-hidden /> {booking.handLuggage} hand
            luggage
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-2 sm:divide-y-0">
          <DetailRow
            icon={<Users className="h-4 w-4" aria-hidden />}
            label="Lead passenger"
            value={booking.passengerName}
          />
          <DetailRow
            icon={<Mail className="h-4 w-4" aria-hidden />}
            label="Email"
            value={booking.email}
          />
          <DetailRow
            icon={<Phone className="h-4 w-4" aria-hidden />}
            label="Phone"
            value={
              booking.phone
                ? `${booking.countryCode ? `${booking.countryCode} ` : ''}${booking.phone}`
                : null
            }
          />
        </dl>
      </Card>

      {/* Price */}
      <Card>
        <h2 className="mb-4 text-lg font-bold text-gray-900">Price</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-gray-600">Transfer ({booking.vehicle?.name ?? 'vehicle'})</dt>
            <dd className="font-medium text-gray-900">
              {formatCurrency(booking.totalPrice - extrasTotal)}
            </dd>
          </div>
          {booking.extras.map((extra) => (
            <div key={extra.id} className="flex justify-between gap-3">
              <dt className="text-gray-600">{extra.label}</dt>
              <dd className="font-medium text-gray-900">
                {extra.price > 0 ? formatCurrency(extra.price) : 'Free'}
              </dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 border-t border-gray-100 pt-3">
            <dt className="font-bold text-gray-900">Total</dt>
            <dd className="text-lg font-bold text-gray-900">{formatCurrency(booking.totalPrice)}</dd>
          </div>
        </dl>

        {booking.paymentStatus === 'paid' && (
          <p className="mt-4 flex items-center gap-2 text-sm text-green-700">
            <CreditCard className="h-4 w-4" aria-hidden /> Paid in full — nothing to pay the driver.
          </p>
        )}
      </Card>
    </div>
  );
}

export default function ConfirmationPage() {
  const { reference = '' } = useParams<{ reference: string }>();
  usePageTitle(reference ? `Booking ${reference}` : 'Booking confirmation');

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['booking', reference.toUpperCase()],
    queryFn: () => api.booking(reference),
    enabled: reference.length > 0,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="bg-gray-50 py-12">
        <div className="container-narrow space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="bg-gray-50 py-16">
        <div className="container-narrow">
          <Card className="mx-auto max-w-xl text-center">
            <h1 className="mb-2 text-xl font-bold text-gray-900">
              We could not find that booking
            </h1>
            <p className="mb-6 text-sm text-gray-500">
              The reference {reference ? <strong>{reference}</strong> : null} does not match any
              booking. Check your confirmation email or contact our team.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink to={ROUTES.lookup}>Find my booking</ButtonLink>
              <ButtonLink to={ROUTES.helpContact} variant="outline">
                Contact support
              </ButtonLink>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const paid = booking.paymentStatus === 'paid';

  return (
    <div className="bg-gray-50 py-10 lg:py-14">
      <div className="container-narrow">
        {/* Success header */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-card">
          <div className="bg-gradient-to-br from-primary-700 to-primary px-6 py-10 text-center text-white sm:px-10">
            <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 animate-scale-in">
              <CircleCheckBig className="h-9 w-9" aria-hidden />
            </span>
            <h1 className="mb-2 text-2xl font-bold sm:text-3xl">
              {paid ? 'Your transfer is confirmed' : 'Your booking is reserved'}
            </h1>
            <p className="mx-auto max-w-xl text-sm text-white/80">
              {paid
                ? 'A confirmation email with all the details is on its way. Your driver will track your flight and meet you on arrival.'
                : 'We are holding this transfer for you. Complete the payment to confirm your driver.'}
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 border-b border-gray-100 px-6 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Booking reference
              </p>
              <p className="font-mono text-2xl font-bold tracking-wider text-primary-700">
                {booking.reference}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4" aria-hidden /> Print
              </Button>
              <ButtonAnchor
                href={`mailto:${SITE.supportEmail}?subject=${encodeURIComponent(
                  `Booking ${booking.reference}`,
                )}`}
                variant="outline"
              >
                <Mail className="h-4 w-4" aria-hidden /> Email us
              </ButtonAnchor>
            </div>
          </div>
        </div>

        {!paid && (
          <Alert tone="warning" title="Payment outstanding" className="mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span>This booking has not been paid for yet.</span>
              <ButtonLink
                to={`${ROUTES.payment}?reference=${encodeURIComponent(booking.reference)}`}
                size="sm"
              >
                Complete payment
              </ButtonLink>
            </div>
          </Alert>
        )}

        <BookingSummary booking={booking} />

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <Link to={ROUTES.home} className="text-sm font-semibold text-primary-700 hover:underline">
            ← Book another transfer
          </Link>
          <p className="text-sm text-gray-400">
            Need to change something?{' '}
            <Link to={ROUTES.helpContact} className="font-medium text-primary-700 hover:underline">
              Contact our team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

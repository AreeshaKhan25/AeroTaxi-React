import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Briefcase,
  CircleCheck,
  Cog,
  Route as RouteIcon,
  Save,
  ShoppingBag,
  User,
  Users,
} from 'lucide-react';
import {
  AdminButton,
  AdminCard,
  AdminError,
  AdminField,
  AdminInput,
  AdminSelect,
  AdminSpinner,
  AdminTextarea,
  PaymentBadge,
  StatusBadge,
} from '@/components/admin/AdminUi';
import { useVehicles } from '@/hooks/useCatalog';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ApiError, adminApi, type AdminBookingPayload } from '@/lib/api';
import { formatAmount, formatCurrency, formatTimestamp } from '@/lib/format';
import { ROUTES } from '@/lib/site';
import type { Booking } from '@/types';

const STATUSES = ['new', 'confirmed', 'pending', 'completed', 'cancelled', 'assigned', 'bidding'];
const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'];

interface FormState {
  fromLocation: string;
  toLocation: string;
  departDate: string;
  departTime: string;
  flightNumber: string;
  noteToDriver: string;
  passengerName: string;
  email: string;
  countryCode: string;
  phone: string;
  vehicleId: string;
  totalPrice: string;
  status: string;
  paymentStatus: string;
  paymentId: string;
}

const toForm = (booking: Booking): FormState => ({
  fromLocation: booking.fromLocation ?? '',
  toLocation: booking.toLocation ?? '',
  departDate: booking.departDate ?? '',
  departTime: booking.departTime ?? '',
  flightNumber: booking.flightNumber ?? '',
  noteToDriver: booking.noteToDriver ?? '',
  passengerName: booking.passengerName ?? '',
  email: booking.email ?? '',
  countryCode: booking.countryCode ?? '',
  phone: booking.phone ?? '',
  vehicleId: String(booking.vehicleId ?? ''),
  totalPrice: formatAmount(booking.totalPrice),
  status: booking.status ?? 'new',
  paymentStatus: booking.paymentStatus ?? 'unpaid',
  paymentId: booking.paymentId ?? '',
});

export default function AdminBookingDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const bookingId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const vehicles = useVehicles();
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);

  const { data: booking, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'booking', bookingId],
    queryFn: () => adminApi.booking(bookingId),
    enabled: Number.isFinite(bookingId) && bookingId > 0,
    retry: false,
  });

  usePageTitle(booking ? `Booking ${booking.reference}` : 'Booking');

  useEffect(() => {
    if (booking) setForm(toForm(booking));
  }, [booking]);

  const save = useMutation({
    mutationFn: (payload: AdminBookingPayload) => adminApi.updateBooking(bookingId, payload),
    onSuccess: (result) => {
      setErrors({});
      setSaved(result.message);
      queryClient.setQueryData(['admin', 'booking', bookingId], result.booking);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: (mutationError) => {
      setSaved(null);
      if (mutationError instanceof ApiError && mutationError.isValidation) {
        setErrors(mutationError.errors);
        return;
      }
      setErrors({
        _: mutationError instanceof Error ? mutationError.message : 'The booking could not be saved.',
      });
    },
  });

  if (isLoading) return <AdminSpinner label="Loading booking…" />;
  if (isError || !booking) {
    return (
      <div className="space-y-4">
        <AdminError
          message={
            error instanceof ApiError && error.status === 404
              ? 'That booking does not exist.'
              : error instanceof Error
                ? error.message
                : undefined
          }
        />
        <Link to={ROUTES.admin.jobs} className="text-sm font-medium text-primary-700 hover:underline">
          ← Back to jobs
        </Link>
      </div>
    );
  }

  if (!form) return <AdminSpinner />;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => (current ? { ...current, [key]: value } : current));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    save.mutate({
      fromLocation: form.fromLocation.trim(),
      toLocation: form.toLocation.trim(),
      departDate: form.departDate,
      departTime: form.departTime || null,
      vehicleId: Number(form.vehicleId),
      passengerName: form.passengerName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      countryCode: form.countryCode.trim() || null,
      flightNumber: form.flightNumber.trim().toUpperCase() || null,
      noteToDriver: form.noteToDriver.trim() || null,
      status: form.status,
      paymentStatus: form.paymentStatus,
      paymentId: form.paymentId.trim() || null,
      totalPrice: Number(form.totalPrice),
    });
  };

  const fieldError = (key: string) =>
    errors[key] ? <span className="text-red-600">{errors[key]}</span> : undefined;

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </button>
        <span className="text-sm text-gray-400">Booking ID: {booking.id}</span>
      </div>

      {saved && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CircleCheck className="h-4 w-4" aria-hidden /> {saved}
        </div>
      )}

      {errors._ && <div className="mb-6"><AdminError message={errors._} /></div>}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-xl font-bold text-gray-900">{booking.reference}</h1>
        <StatusBadge status={booking.status} />
        <PaymentBadge status={booking.paymentStatus} />
        <span className="ml-auto flex flex-wrap gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-gray-400" aria-hidden /> {booking.passengers}
          </span>
          <span className="flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-gray-400" aria-hidden /> {booking.suitcases}
          </span>
          <span className="flex items-center gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5 text-gray-400" aria-hidden /> {booking.handLuggage}
          </span>
        </span>
      </div>

      <form onSubmit={submit} noValidate>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AdminCard
            title={
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
                <RouteIcon className="h-4 w-4 text-primary-600" aria-hidden /> Journey Information
              </h3>
            }
          >
            <div className="space-y-4">
              <AdminField label="Pickup location" hint={fieldError('fromLocation')}>
                <AdminInput
                  value={form.fromLocation}
                  onChange={(event) => set('fromLocation', event.target.value)}
                />
              </AdminField>
              <AdminField label="Drop-off location" hint={fieldError('toLocation')}>
                <AdminInput
                  value={form.toLocation}
                  onChange={(event) => set('toLocation', event.target.value)}
                />
              </AdminField>
              <div className="grid grid-cols-2 gap-4">
                <AdminField label="Date" hint={fieldError('departDate')}>
                  <AdminInput
                    type="date"
                    value={form.departDate}
                    onChange={(event) => set('departDate', event.target.value)}
                  />
                </AdminField>
                <AdminField label="Time" hint={fieldError('departTime')}>
                  <AdminInput
                    type="time"
                    value={form.departTime}
                    onChange={(event) => set('departTime', event.target.value)}
                  />
                </AdminField>
              </div>
              <AdminField label="Flight number" hint={fieldError('flightNumber')}>
                <AdminInput
                  value={form.flightNumber}
                  placeholder="e.g. BA1234"
                  className="uppercase"
                  onChange={(event) => set('flightNumber', event.target.value)}
                />
              </AdminField>
              <AdminField label="Note to driver" hint={fieldError('noteToDriver')}>
                <AdminTextarea
                  rows={2}
                  value={form.noteToDriver}
                  placeholder="Any special instructions…"
                  onChange={(event) => set('noteToDriver', event.target.value)}
                />
              </AdminField>
            </div>
          </AdminCard>

          <AdminCard
            title={
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
                <User className="h-4 w-4 text-primary-600" aria-hidden /> Passenger Information
              </h3>
            }
          >
            <div className="space-y-4">
              <AdminField label="Full name" hint={fieldError('passengerName')}>
                <AdminInput
                  value={form.passengerName}
                  onChange={(event) => set('passengerName', event.target.value)}
                />
              </AdminField>
              <AdminField label="Email" hint={fieldError('email')}>
                <AdminInput
                  type="email"
                  value={form.email}
                  onChange={(event) => set('email', event.target.value)}
                />
              </AdminField>
              <div className="grid grid-cols-3 gap-3">
                <AdminField label="Country code" hint={fieldError('countryCode')}>
                  <AdminInput
                    value={form.countryCode}
                    placeholder="+44"
                    onChange={(event) => set('countryCode', event.target.value)}
                  />
                </AdminField>
                <AdminField label="Phone" className="col-span-2" hint={fieldError('phone')}>
                  <AdminInput
                    value={form.phone}
                    onChange={(event) => set('phone', event.target.value)}
                  />
                </AdminField>
              </div>

              {booking.extras.length > 0 && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Extras booked
                  </p>
                  <ul className="space-y-1 text-sm">
                    {booking.extras.map((extra) => (
                      <li key={extra.id} className="flex justify-between gap-3">
                        <span className="text-gray-600">{extra.label}</span>
                        <span className="font-medium text-gray-900">
                          {extra.price > 0 ? formatCurrency(extra.price) : 'Free'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AdminCard>

          <AdminCard
            title={
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
                <Briefcase className="h-4 w-4 text-primary-600" aria-hidden /> Vehicle &amp; Pricing
              </h3>
            }
          >
            <div className="space-y-4">
              <AdminField label="Vehicle type" hint={fieldError('vehicleId')}>
                <AdminSelect
                  value={form.vehicleId}
                  onChange={(event) => set('vehicleId', event.target.value)}
                >
                  {(vehicles.data ?? []).map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name}
                      {vehicle.carModel ? ` (${vehicle.carModel})` : ''} — from{' '}
                      {formatCurrency(vehicle.price)}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>
              <AdminField label="Total price (£)" hint={fieldError('totalPrice')}>
                <AdminInput
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.totalPrice}
                  onChange={(event) => set('totalPrice', event.target.value)}
                />
              </AdminField>
              {(booking.distance || booking.duration) && (
                <p className="text-xs text-gray-400">
                  Quoted journey: {booking.distance ?? '—'} · {booking.duration ?? '—'}
                </p>
              )}
            </div>
          </AdminCard>

          <AdminCard
            title={
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-800">
                <Cog className="h-4 w-4 text-primary-600" aria-hidden /> Status &amp; Payment
              </h3>
            }
          >
            <div className="space-y-4">
              <AdminField label="Booking status" hint={fieldError('status')}>
                <AdminSelect
                  value={form.status}
                  onChange={(event) => set('status', event.target.value)}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>
              <AdminField label="Payment status" hint={fieldError('paymentStatus')}>
                <AdminSelect
                  value={form.paymentStatus}
                  onChange={(event) => set('paymentStatus', event.target.value)}
                >
                  {PAYMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>
              <AdminField label="Payment ID" hint={fieldError('paymentId')}>
                <AdminInput
                  value={form.paymentId}
                  placeholder="Stripe/manual reference"
                  className="font-mono text-xs"
                  onChange={(event) => set('paymentId', event.target.value)}
                />
              </AdminField>
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
                <div>Created: {formatTimestamp(booking.createdAt)}</div>
                <div>Updated: {formatTimestamp(booking.updatedAt)}</div>
              </div>
            </div>
          </AdminCard>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <AdminButton type="submit" loading={save.isPending}>
            <Save className="h-4 w-4" aria-hidden /> Save all changes
          </AdminButton>
          <button
            type="button"
            onClick={() => setForm(toForm(booking))}
            className="text-sm text-gray-500 transition hover:text-gray-800"
          >
            Reset
          </button>
        </div>
      </form>
    </>
  );
}

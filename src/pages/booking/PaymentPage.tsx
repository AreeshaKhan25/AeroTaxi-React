import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { ChevronLeft, CreditCard, Lock, ShieldCheck, TriangleAlert } from 'lucide-react';
import { StepProgress } from '@/components/booking/StepProgress';
import { JourneyCard, SelectedVehicleCard, TotalBar } from '@/components/booking/JourneyCard';
import { RefundBanner, TrustBadges } from '@/components/booking/TrustBadges';
import { Button } from '@/components/ui/Button';
import { Alert, Card, Skeleton } from '@/components/ui/Surface';
import { useToast } from '@/components/ui/Toast';
import { useAppConfig } from '@/hooks/useCatalog';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ApiError, api } from '@/lib/api';
import { formatCurrency } from '@/lib/format';
import { ROUTES } from '@/lib/site';
import type { Booking } from '@/types';

/** `loadStripe` must only ever be called once per publishable key. */
const stripeCache = new Map<string, Promise<Stripe | null>>();
function getStripe(key: string): Promise<Stripe | null> {
  let instance = stripeCache.get(key);
  if (!instance) {
    instance = loadStripe(key);
    stripeCache.set(key, instance);
  }
  return instance;
}

function PaymentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <StepProgress current={3} />
      <div className="container-narrow py-8">{children}</div>
    </div>
  );
}

/* ----------------------------------------------------------- Stripe form */

function StripePaymentForm({
  booking,
  onPaid,
}: {
  booking: Booking;
  onPaid: (paymentIntentId?: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}${ROUTES.confirmation(booking.reference)}`,
        payment_method_data: {
          billing_details: {
            name: booking.passengerName ?? undefined,
            email: booking.email ?? undefined,
          },
        },
      },
    });

    if (error) {
      setMessage(error.message ?? 'Your card could not be charged. Please try another card.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent && ['succeeded', 'processing', 'requires_capture'].includes(paymentIntent.status)) {
      onPaid(paymentIntent.id);
      return;
    }

    setMessage('The payment was not completed. Please try again.');
    setSubmitting(false);
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <PaymentElement options={{ layout: 'tabs' }} />

      {message && (
        <Alert tone="danger" icon={<TriangleAlert className="h-4 w-4" aria-hidden />}>
          {message}
        </Alert>
      )}

      <Button type="submit" size="lg" fullWidth loading={submitting} disabled={!stripe || !elements}>
        {!submitting && <Lock className="h-4 w-4" aria-hidden />}
        Pay {formatCurrency(booking.totalPrice)}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        Payments are processed securely by Stripe. We never store your card details.
      </p>
    </form>
  );
}

/* ------------------------------------------------------------- demo form */

function DemoPaymentForm({
  booking,
  onPaid,
  pending,
}: {
  booking: Booking;
  onPaid: () => void;
  pending: boolean;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onPaid();
      }}
      className="space-y-5"
    >
      <Alert tone="info" title="Demo payment mode">
        Stripe keys are not configured, so no card is charged. Submitting this form confirms the
        booking exactly as a real payment would, including the confirmation emails.
      </Alert>

      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <CreditCard className="h-4 w-4 text-primary-700" aria-hidden /> Test card
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">Card number</dt>
            <dd className="font-mono text-gray-900">4242 4242 4242 4242</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Expiry</dt>
            <dd className="font-mono text-gray-900">12 / 34</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">CVC</dt>
            <dd className="font-mono text-gray-900">123</dd>
          </div>
        </dl>
      </div>

      <Button type="submit" size="lg" fullWidth loading={pending}>
        {!pending && <Lock className="h-4 w-4" aria-hidden />}
        Pay {formatCurrency(booking.totalPrice)}
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------------ page */

export default function PaymentPage() {
  usePageTitle('Payment');
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const reference = (searchParams.get('reference') ?? '').trim().toUpperCase();

  const config = useAppConfig();

  const bookingQuery = useQuery({
    queryKey: ['booking', reference],
    queryFn: () => api.booking(reference),
    enabled: reference.length > 0,
    retry: false,
  });

  const booking = bookingQuery.data ?? null;

  const intentQuery = useQuery({
    queryKey: ['payment-intent', reference],
    queryFn: () => api.paymentIntent(reference),
    enabled: Boolean(booking) && booking?.paymentStatus !== 'paid',
    retry: false,
    staleTime: Infinity,
  });

  const confirm = useMutation({
    mutationFn: (paymentIntentId?: string) => api.confirmBooking(reference, paymentIntentId),
    onSuccess: () => navigate(ROUTES.confirmation(reference), { replace: true }),
    onError: (error) =>
      toast.error(
        'We could not confirm your booking',
        error instanceof ApiError ? error.message : 'Please contact support with your reference.',
      ),
  });

  /* A booking that is already paid belongs on the confirmation page. */
  useEffect(() => {
    if (booking && booking.paymentStatus === 'paid') {
      navigate(ROUTES.confirmation(booking.reference), { replace: true });
    }
  }, [booking, navigate]);

  const stripePromise = useMemo(() => {
    const key = config.data?.stripePublishableKey;
    return key ? getStripe(key) : null;
  }, [config.data?.stripePublishableKey]);

  if (!reference) {
    return (
      <PaymentShell>
        <Card className="mx-auto max-w-xl text-center">
          <h1 className="mb-2 text-xl font-bold text-gray-900">No booking to pay for</h1>
          <p className="mb-6 text-sm text-gray-500">
            Start a new search, or look up an existing booking with its reference.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate(ROUTES.home)}>Book a transfer</Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.lookup)}>
              Find my booking
            </Button>
          </div>
        </Card>
      </PaymentShell>
    );
  }

  if (bookingQuery.isLoading) {
    return (
      <PaymentShell>
        <div className="flex flex-col gap-8 lg:flex-row">
          <Skeleton className="h-80 w-full lg:w-[380px]" />
          <Skeleton className="h-96 flex-1" />
        </div>
      </PaymentShell>
    );
  }

  if (bookingQuery.isError || !booking) {
    return (
      <PaymentShell>
        <Card className="mx-auto max-w-xl text-center">
          <h1 className="mb-2 text-xl font-bold text-gray-900">We could not find {reference}</h1>
          <p className="mb-6 text-sm text-gray-500">
            Double-check the reference in your email, or contact our support team.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate(ROUTES.lookup)}>Find my booking</Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.helpContact)}>
              Contact support
            </Button>
          </div>
        </Card>
      </PaymentShell>
    );
  }

  const intent = intentQuery.data;
  const useStripeCheckout = Boolean(intent && !intent.demo && intent.clientSecret && stripePromise);

  return (
    <PaymentShell>
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Summary */}
        <div className="w-full flex-shrink-0 lg:w-[380px]">
          <div className="space-y-5 lg:sticky lg:top-24">
            <h2 className="text-xl font-bold text-gray-900">Your journey</h2>

            <JourneyCard
              from={booking.fromLocation}
              to={booking.toLocation}
              date={booking.departDate}
              time={booking.departTime}
            />

            {booking.vehicle && (
              <SelectedVehicleCard
                vehicle={booking.vehicle}
                price={booking.totalPrice - booking.extras.reduce((sum, extra) => sum + extra.price, 0)}
              />
            )}

            {booking.extras.length > 0 && (
              <div className="rounded-xl border border-gray-100 bg-white p-4">
                <h3 className="mb-3 text-sm font-bold text-gray-900">Extras</h3>
                <ul className="space-y-2 text-sm">
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

            <div className="rounded-xl border border-gray-100 bg-white p-4 text-sm">
              <h3 className="mb-3 text-sm font-bold text-gray-900">Booking reference</h3>
              <p className="font-mono text-base font-bold tracking-wider text-primary-700">
                {booking.reference}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Keep this reference — you can use it to view or amend your booking.
              </p>
            </div>

            <TotalBar total={booking.totalPrice} label="Total to pay" />
          </div>
        </div>

        {/* Payment */}
        <div className="min-w-0 flex-1">
          <h1 className="mb-2 text-2xl font-bold text-gray-900 lg:text-3xl">Payment</h1>
          <p className="mb-8 text-sm text-gray-500">
            Your transfer is held for you while you pay. Free cancellation up to 24 hours before
            pick-up.
          </p>

          <Card className="mb-6">
            {intentQuery.isLoading && <Skeleton className="h-40 w-full" />}

            {intentQuery.isError && (
              <Alert tone="danger" title="We could not start the payment">
                {intentQuery.error instanceof Error
                  ? intentQuery.error.message
                  : 'Please refresh the page to try again.'}
              </Alert>
            )}

            {useStripeCheckout && intent?.clientSecret && stripePromise && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: intent.clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#0C6291',
                      borderRadius: '12px',
                      fontFamily: '"Instrument Sans", system-ui, sans-serif',
                    },
                  },
                }}
              >
                <StripePaymentForm
                  booking={booking}
                  onPaid={(paymentIntentId) => confirm.mutate(paymentIntentId)}
                />
              </Elements>
            )}

            {intent?.demo && (
              <DemoPaymentForm
                booking={booking}
                pending={confirm.isPending}
                onPaid={() => confirm.mutate(undefined)}
              />
            )}
          </Card>

          <RefundBanner className="mb-6" />
          <TrustBadges />

          <div className="py-6">
            <Link
              to={ROUTES.home}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> Back to home
            </Link>
          </div>
        </div>
      </div>
    </PaymentShell>
  );
}

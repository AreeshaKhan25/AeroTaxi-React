import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Plane,
  ShoppingBag,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { StepProgress } from '@/components/booking/StepProgress';
import { JourneyCard, SelectedVehicleCard, TotalBar } from '@/components/booking/JourneyCard';
import { RouteMap, RouteMetrics } from '@/components/booking/RouteMap';
import { Counter, ExtrasSection } from '@/components/booking/ExtrasSection';
import { PhoneField } from '@/components/booking/PhoneField';
import { RefundBanner, TrustBadges } from '@/components/booking/TrustBadges';
import { Button } from '@/components/ui/Button';
import { Checkbox, Input, Textarea } from '@/components/ui/Field';
import { Alert, Card, Skeleton } from '@/components/ui/Surface';
import { useToast } from '@/components/ui/Toast';
import { useBookingParams } from '@/hooks/useBookingParams';
import { useVehicles } from '@/hooks/useCatalog';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRoute } from '@/hooks/useRoute';
import { ApiError, api } from '@/lib/api';
import { DEFAULT_COUNTRY, type Country } from '@/lib/countries';
import { extrasPayload, extrasTotal } from '@/lib/pricing';
import { ROUTES } from '@/lib/site';
import type { FlightLookupResult } from '@/types';

const passengerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .min(5, 'Enter a valid phone number')
    .regex(/^[\d\s()-]+$/, 'Phone numbers can only contain digits, spaces and brackets'),
  flightNumber: z
    .string()
    .trim()
    .max(20, 'Flight numbers are at most 20 characters')
    .optional()
    .or(z.literal('')),
  noteToDriver: z.string().trim().max(500, 'Keep your note under 500 characters').optional(),
  agreePromotions: z.boolean().default(false),
});

type PassengerForm = z.infer<typeof passengerSchema>;

/** Field-level errors coming back from the API, mapped to form inputs. */
const SERVER_FIELD_MAP: Record<string, keyof PassengerForm> = {
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  phone: 'phone',
  flightNumber: 'flightNumber',
  noteToDriver: 'noteToDriver',
};

function FlightStatusMessage({ result }: { result: FlightLookupResult | 'error' }) {
  if (result === 'error') {
    return (
      <Alert tone="danger" icon={<CircleX className="h-4 w-4" aria-hidden />}>
        Unable to validate the flight right now. You can still continue with your booking.
      </Alert>
    );
  }

  if (result.found) {
    return (
      <Alert tone="success" icon={<CircleCheck className="h-4 w-4" aria-hidden />} title="Flight verified">
        {result.info}
      </Alert>
    );
  }

  return (
    <Alert tone="warning" icon={<TriangleAlert className="h-4 w-4" aria-hidden />}>
      {result.reason === 'invalid-format'
        ? 'That does not look like a flight number — try the format BA1234.'
        : 'The flight was not found for the specified date. If you are sure it is correct, feel free to proceed with the booking.'}
    </Alert>
  );
}

export default function TransferDetailsPage() {
  usePageTitle('Transfer details');
  const navigate = useNavigate();
  const toast = useToast();
  const params = useBookingParams();

  const vehicles = useVehicles();
  const route = useRoute(params.from, params.to);

  const vehicle = useMemo(
    () => (vehicles.data ?? []).find((entry) => entry.id === params.vehicleId) ?? null,
    [vehicles.data, params.vehicleId],
  );

  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [passengers, setPassengers] = useState(1);
  const [suitcases, setSuitcases] = useState(0);
  const [handLuggage, setHandLuggage] = useState(0);
  const [flightResult, setFlightResult] = useState<FlightLookupResult | 'error' | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<PassengerForm>({
    resolver: zodResolver(passengerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      flightNumber: '',
      noteToDriver: '',
      agreePromotions: false,
    },
  });

  const basePrice = params.price ?? vehicle?.price ?? 0;
  const total = basePrice + extrasTotal(selectedExtras);

  const flightNumber = watch('flightNumber') ?? '';
  const phone = watch('phone');

  const validateFlight = useMutation({
    mutationFn: () => api.validateFlight(flightNumber.trim().toUpperCase(), params.date || undefined),
    onSuccess: (result) => setFlightResult(result),
    onError: () => setFlightResult('error'),
  });

  const createBooking = useMutation({
    mutationFn: (values: PassengerForm) =>
      api.createBooking({
        fromLocation: params.from,
        toLocation: params.to,
        departDate: params.date,
        departTime: params.time || null,
        vehicleId: vehicle!.id,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        countryCode: `+${country.code}`,
        flightNumber: values.flightNumber?.trim() ? values.flightNumber.trim().toUpperCase() : null,
        noteToDriver: values.noteToDriver?.trim() || null,
        passengers,
        suitcases,
        handLuggage,
        extras: extrasPayload(selectedExtras),
        distance: route.data?.distanceLabel ?? params.distance ?? null,
        duration: route.data?.durationLabel ?? params.duration ?? null,
        totalPrice: total,
        agreePromotions: values.agreePromotions,
      }),
    onSuccess: (booking) => {
      navigate(`${ROUTES.payment}?reference=${encodeURIComponent(booking.reference)}`);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.isValidation) {
        let mapped = false;
        for (const [key, message] of Object.entries(error.errors)) {
          const field = SERVER_FIELD_MAP[key];
          if (field) {
            setError(field, { type: 'server', message });
            mapped = true;
          }
        }
        if (!mapped) toast.error('We could not save your booking', Object.values(error.errors)[0]);
        return;
      }
      toast.error(
        'We could not save your booking',
        error instanceof Error ? error.message : undefined,
      );
    },
  });

  const toggleExtra = (id: string) =>
    setSelectedExtras((current) =>
      current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
    );

  /* Guard: this step needs a journey and a vehicle from the previous step. */
  const incomplete = !params.from || !params.to || !params.date || !params.vehicleId;

  if (incomplete || (vehicles.isFetched && !vehicle)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StepProgress current={2} />
        <div className="container-narrow py-16">
          <Card className="mx-auto max-w-xl text-center">
            <h1 className="mb-2 text-xl font-bold text-gray-900">Let&rsquo;s start your journey</h1>
            <p className="mb-6 text-sm text-gray-500">
              We need your route, departure time and vehicle before we can take your details.
            </p>
            <Button onClick={() => navigate(ROUTES.home)}>Back to search</Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StepProgress current={2} />
        <div className="container-narrow py-8">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StepProgress current={2} />

      <div className="container-narrow py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar */}
          <div className="w-full flex-shrink-0 lg:w-[380px]">
            <div className="space-y-5 lg:sticky lg:top-24">
              <h2 className="text-xl font-bold text-gray-900">Your journey</h2>

              <JourneyCard
                from={params.from}
                to={params.to}
                date={params.date}
                time={params.time}
              />

              <RouteMap
                route={route.data}
                loading={route.isFetching}
                error={route.error}
                hasJourney={Boolean(params.from?.trim() && params.to?.trim())}
                height="h-44"
              />

              <RouteMetrics
                route={route.data}
                loading={route.isFetching}
                fallbackDistance={params.distance}
                fallbackDuration={params.duration}
              />

              <SelectedVehicleCard vehicle={vehicle} price={basePrice} />

              <TotalBar total={total} />
            </div>
          </div>

          {/* Form */}
          <div className="min-w-0 flex-1">
            <h1 className="mb-8 text-2xl font-bold text-gray-900 lg:text-3xl">Booking details</h1>

            <form
              onSubmit={handleSubmit((values) => createBooking.mutate(values))}
              className="space-y-8"
              noValidate
            >
              {/* Transfer */}
              <Card>
                <h2 className="mb-2 text-lg font-bold text-gray-900">Transfer</h2>
                <p className="mb-5 text-sm text-gray-500">
                  Your driver keeps an eye on your flight status and will adjust the pickup time if
                  your flight is delayed.
                </p>

                <div className="space-y-4">
                  {flightResult && <FlightStatusMessage result={flightResult} />}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      {...register('flightNumber')}
                      placeholder="Flight number (e.g. BA1234)"
                      aria-label="Flight number"
                      className="flex-1 uppercase"
                      invalid={Boolean(errors.flightNumber)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          if (flightNumber.trim()) validateFlight.mutate();
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      className="bg-cream"
                      disabled={!flightNumber.trim()}
                      loading={validateFlight.isPending}
                      onClick={() => validateFlight.mutate()}
                    >
                      {!validateFlight.isPending && <Plane className="h-3.5 w-3.5" aria-hidden />}
                      {validateFlight.isPending ? 'Checking…' : 'Validate'}
                    </Button>
                  </div>
                  {errors.flightNumber && (
                    <p className="text-xs font-medium text-red-600">
                      {errors.flightNumber.message}
                    </p>
                  )}

                  <Textarea
                    {...register('noteToDriver')}
                    rows={2}
                    placeholder="Note to driver"
                    aria-label="Note to driver"
                    invalid={Boolean(errors.noteToDriver)}
                  />
                  {errors.noteToDriver && (
                    <p className="text-xs font-medium text-red-600">
                      {errors.noteToDriver.message}
                    </p>
                  )}
                </div>
              </Card>

              {/* Passengers */}
              <Card>
                <h2 className="mb-5 text-lg font-bold text-gray-900">Passengers</h2>

                <div className="mb-6 flex flex-wrap gap-6">
                  <Counter
                    label="passengers"
                    icon={<Users className="h-4 w-4" aria-hidden />}
                    value={passengers}
                    min={1}
                    max={vehicle.passengers}
                    onChange={setPassengers}
                  />
                  <Counter
                    label="suitcases"
                    icon={<Briefcase className="h-4 w-4" aria-hidden />}
                    value={suitcases}
                    max={vehicle.suitcases}
                    onChange={setSuitcases}
                  />
                  <Counter
                    label="hand luggage"
                    icon={<ShoppingBag className="h-4 w-4" aria-hidden />}
                    value={handLuggage}
                    max={vehicle.passengers}
                    onChange={setHandLuggage}
                  />
                </div>

                <p className="mb-4 text-sm text-gray-500">
                  {vehicle.name} seats up to {vehicle.passengers} passengers with{' '}
                  {vehicle.suitcases} suitcases
                  {vehicle.handLuggageNote ? `, ${vehicle.handLuggageNote}` : ''}.
                </p>

                <p className="mb-4 text-sm font-medium text-gray-700">
                  The details of your lead passenger
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Input
                        {...register('firstName')}
                        placeholder="First name*"
                        aria-label="First name"
                        autoComplete="given-name"
                        invalid={Boolean(errors.firstName)}
                      />
                      {errors.firstName && (
                        <p className="mt-1.5 text-xs font-medium text-red-600">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Input
                        {...register('lastName')}
                        placeholder="Last name*"
                        aria-label="Last name"
                        autoComplete="family-name"
                        invalid={Boolean(errors.lastName)}
                      />
                      {errors.lastName && (
                        <p className="mt-1.5 text-xs font-medium text-red-600">
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Input
                      {...register('email')}
                      type="email"
                      placeholder="Email*"
                      aria-label="Email address"
                      autoComplete="email"
                      invalid={Boolean(errors.email)}
                    />
                    {errors.email && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-gray-400">
                      Your confirmation and booking reference are sent here.
                    </p>
                  </div>

                  <div>
                    <PhoneField
                      country={country}
                      onCountryChange={setCountry}
                      value={phone}
                      onChange={(value) => setValue('phone', value, { shouldValidate: false })}
                      invalid={Boolean(errors.phone)}
                      required
                    />
                    {errors.phone && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Extras */}
              <Card>
                <h2 className="mb-2 text-lg font-bold text-gray-900">Optional extras</h2>
                <p className="mb-5 text-sm text-gray-500">
                  Flight tracking, child seats and cancellation are included for free.
                </p>
                <ExtrasSection selected={selectedExtras} onToggle={toggleExtra} />
              </Card>

              <RefundBanner />

              <Checkbox {...register('agreePromotions')}>
                I agree to receive booking confirmations and occasional promotions. No spam.
              </Checkbox>

              <Button type="submit" size="lg" fullWidth loading={createBooking.isPending}>
                Continue to payment
                {!createBooking.isPending && <ChevronRight className="h-4 w-4" aria-hidden />}
              </Button>

              <TrustBadges />

              <div className="pb-4">
                <Link
                  to={{
                    pathname: ROUTES.yourRide,
                    search: window.location.search,
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> Previous
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

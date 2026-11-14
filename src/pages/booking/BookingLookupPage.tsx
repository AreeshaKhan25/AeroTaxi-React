import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, TicketX } from 'lucide-react';
import { PageHero } from '@/components/common/PageHero';
import { BookingSummary } from '@/pages/booking/ConfirmationPage';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Alert, Card, EmptyState, Skeleton } from '@/components/ui/Surface';
import { usePageTitle } from '@/hooks/usePageTitle';
import { api } from '@/lib/api';
import { ROUTES } from '@/lib/site';

export default function BookingLookupPage() {
  usePageTitle('Find my booking');
  const [searchParams, setSearchParams] = useSearchParams();
  const queried = (searchParams.get('reference') ?? '').trim().toUpperCase();
  const [reference, setReference] = useState(queried);

  useEffect(() => {
    setReference(queried);
  }, [queried]);

  const lookup = useQuery({
    queryKey: ['booking-lookup', queried],
    queryFn: () => api.lookupBooking(queried),
    enabled: queried.length > 0,
    retry: false,
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = reference.trim().toUpperCase();
    if (!trimmed) return;
    setSearchParams(trimmed ? { reference: trimmed } : {});
  };

  const booking = lookup.data?.booking ?? null;

  return (
    <>
      <PageHero
        title="My booking"
        subtitle="Enter your booking reference to view your transfer details."
        align="center"
      />

      <section className="bg-gray-50 py-12">
        <div className="container-narrow space-y-8">
          <Card className="mx-auto max-w-2xl">
            <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={reference}
                onChange={(event) => setReference(event.target.value.toUpperCase())}
                placeholder="ATH-XXXXXXXX"
                aria-label="Booking reference"
                autoComplete="off"
                spellCheck={false}
                className="flex-1 font-mono uppercase tracking-wider"
                leadingIcon={<Search className="h-4 w-4" aria-hidden />}
              />
              <Button type="submit" loading={lookup.isFetching} className="sm:w-auto">
                Find booking
              </Button>
            </form>
            <p className="mt-3 text-xs text-gray-400">
              Your reference is in the confirmation email we sent when you booked.
            </p>
          </Card>

          {lookup.isFetching && (
            <div className="space-y-6">
              <Skeleton className="h-56 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          )}

          {lookup.isError && !lookup.isFetching && (
            <Alert tone="danger" title="Something went wrong" className="mx-auto max-w-2xl">
              We could not search for that reference just now. Please try again in a moment.
            </Alert>
          )}

          {!lookup.isFetching && queried && lookup.isSuccess && !booking && (
            <Card className="mx-auto max-w-2xl">
              <EmptyState
                icon={<TicketX className="h-6 w-6" aria-hidden />}
                title={`No booking found for ${queried}`}
                description="Check the reference and try again, or contact our support team and we will track it down for you."
                action={
                  <div className="flex flex-wrap justify-center gap-3">
                    <ButtonLink to={ROUTES.helpContact}>Contact support</ButtonLink>
                    <ButtonLink to={ROUTES.home} variant="outline">
                      Book a transfer
                    </ButtonLink>
                  </div>
                }
              />
            </Card>
          )}

          {booking && !lookup.isFetching && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                    Booking reference
                  </p>
                  <p className="font-mono text-xl font-bold tracking-wider text-primary-700">
                    {booking.reference}
                  </p>
                </div>
                <ButtonLink to={ROUTES.confirmation(booking.reference)} variant="outline" size="sm">
                  Open full confirmation
                </ButtonLink>
              </div>

              <BookingSummary booking={booking} />
            </div>
          )}
        </div>
      </section>
    </>
  );
}

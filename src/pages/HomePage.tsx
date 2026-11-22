import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CarFront,
  CircleCheck,
  Clock,
  Handshake,
  MapPin,
  PlaneTakeoff,
  Search,
  Star,
  UserPen,
  Wallet,
} from 'lucide-react';
import { Carousel } from '@/components/common/Carousel';
import { Accordion } from '@/components/ui/Accordion';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Surface';
import {
  BookingSearchForm,
  type JourneySelection,
} from '@/components/booking/BookingSearchForm';
import { VehicleCard } from '@/components/booking/VehicleViews';
import { useAirports, useFaqs, useVehicles } from '@/hooks/useCatalog';
import { buildBookingSearch } from '@/hooks/useBookingParams';
import { ROUTES } from '@/lib/site';
import type { Airport } from '@/types';

const REASONS = [
  {
    icon: Clock,
    title: '24/7 Service',
    description:
      'Our services are available around the clock to ensure all your travel needs are covered.',
  },
  {
    icon: Star,
    title: 'Reliable, insured suppliers',
    description:
      'We work with vetted and licensed local taxi drivers and offer 24/7 support for a safe, seamless journey.',
  },
  {
    icon: Handshake,
    title: 'Meet & Greet',
    description: 'Our taxi drivers welcome you at arrivals for a smooth start to your journey.',
  },
  {
    icon: PlaneTakeoff,
    title: 'Free flight tracking',
    description:
      'Your driver tracks your flight and adjusts pickup for delays, ensuring a smooth arrival.',
  },
  {
    icon: Wallet,
    title: 'Hassle-Free Refunds',
    description: 'Get a 100% refund if you cancel 24 hours before your transfer.',
  },
  {
    icon: Search,
    title: 'Transparent Pricing',
    description: 'No hidden fees, just affordable and competitive rates.',
  },
] as const;

const HOW_IT_WORKS = [
  { icon: MapPin, label: 'Select a route' },
  { icon: CarFront, label: 'Choose a car' },
  { icon: UserPen, label: 'Fill in details' },
  { icon: CircleCheck, label: 'Confirmed' },
] as const;

function AirportCard({ airport }: { airport: Airport }) {
  return (
    <article className="group h-full overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-card-hover">
      <div className="flex h-32 items-center justify-center bg-gray-50 p-4">
        {airport.image && (
          <img
            src={airport.image}
            alt={airport.name}
            loading="lazy"
            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-bold text-gray-900">{airport.name}</h3>
        <p className="mt-0.5 text-xs text-gray-400">{airport.city}</p>
        <p className="mt-2 text-xs leading-relaxed text-gray-500">{airport.description}</p>
      </div>
    </article>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [journey, setJourney] = useState<JourneySelection>({
    from: '',
    to: '',
    date: '',
    time: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof JourneySelection, string>>>({});

  const airports = useAirports();
  const vehicles = useVehicles();
  const faqs = useFaqs();

  const submit = () => {
    const nextErrors: Partial<Record<keyof JourneySelection, string>> = {};
    if (!journey.from.trim()) nextErrors.from = 'Tell us where to pick you up';
    if (!journey.to.trim()) nextErrors.to = 'Tell us where you are going';
    if (!journey.date) nextErrors.date = 'Choose a departure date and time';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    navigate({
      pathname: ROUTES.yourRide,
      search: buildBookingSearch(journey),
    });
  };

  return (
    <>
      {/* 1 — Hero + booking form */}
      <section className="layer-aurora bg-white py-10 lg:py-16">
        <div className="container-narrow">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <h1 className="mb-3 text-2xl font-bold leading-tight text-gray-900 text-balance sm:mb-4 sm:text-4xl lg:text-5xl">
                Reliable and on-time UK airport taxi transfers
              </h1>
              <p className="mb-6 text-sm text-gray-500 sm:mb-8 sm:text-lg">
                Wherever you&rsquo;re headed, we and our trusted taxi partners will get you there
                comfortably and on time, guaranteed.
              </p>

              <BookingSearchForm
                value={journey}
                onChange={(next) => {
                  setJourney(next);
                  setErrors({});
                }}
                onSubmit={submit}
                errors={errors}
              />
            </div>

            <div className="hidden justify-center lg:flex lg:justify-end">
              <img
                src="/images/banner-image.svg"
                alt="Illustration of a traveller being collected by an airport taxi"
                className="w-full max-w-md xl:max-w-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2 — Reasons to book */}
      <section className="layer-tint bg-lightgreen py-12 sm:py-16 lg:py-20">
        <div className="container-narrow">
          <h2 className="mb-8 text-center text-xl font-bold text-gray-900 text-balance sm:mb-14 sm:text-3xl lg:text-4xl">
            Reasons to book with AeroTAXI
          </h2>

          <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:gap-x-12 sm:gap-y-14 lg:grid-cols-3">
            {REASONS.map(({ icon: Icon, title, description }) => (
              <li key={title} className="text-center">
                <div className="mb-4 flex justify-center">
                  <Icon className="h-8 w-8 text-gray-800 sm:h-12 sm:w-12" strokeWidth={1.5} aria-hidden />
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{description}</p>
              </li>
            ))}
          </ul>

          <div className="mt-14 text-center">
            <Button
              size="lg"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-10"
            >
              Book your journey
            </Button>
          </div>
        </div>
      </section>

      {/* 3 — Reliable service + how it works */}
      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="container-page">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-3">
            <div className="flex justify-center">
              <img
                src="/images/how-it-works.png"
                alt="Traveller booking a transfer on their phone"
                loading="lazy"
                className="w-full rounded-2xl object-cover"
              />
            </div>

            <div className="lg:col-span-2">
              <h2 className="mb-4 text-2xl font-bold leading-tight text-gray-900 text-balance sm:mb-6 sm:text-3xl lg:text-4xl">
                Reliable service &ndash; always low prices
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-600 sm:mb-10 sm:text-base">
                We provide premium airport transfers to and from all airports across the UK. Our
                service is designed to eliminate the common hassles of pre- or post-flight travel.
                You won&rsquo;t need to decipher complicated maps or worry about language barriers.
                Instead, you&rsquo;ll enjoy a comfortable ride directly to your destination. Our
                professional suppliers and their hand-picked drivers are local experts who can track
                your flight to account for any delays. They&rsquo;re also a great resource for local
                tips and advice.
              </p>

              <h3 className="mb-8 text-2xl font-bold text-gray-900">How it works</h3>

              <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-2">
                {HOW_IT_WORKS.map(({ icon: Icon, label }, index) => (
                  <li key={label} className="text-center">
                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-cream sm:h-16 sm:w-16">
                      <Icon className="h-5 w-5 text-gray-800 sm:h-6 sm:w-6" aria-hidden />
                    </div>
                    <p className="text-xs font-semibold text-gray-800 sm:text-sm">
                      <span className="sr-only">Step {index + 1}: </span>
                      {label}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* 4 — Airports we cover */}
      <section className="layer-tint bg-cream py-16">
        <div className="container-page">
          {airports.isLoading ? (
            <div className="flex gap-5 overflow-hidden">
              {Array.from({ length: 5 }).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <Skeleton key={index} className="h-56 w-44 flex-shrink-0 sm:w-56" />
              ))}
            </div>
          ) : (
            <Carousel
              label="Airports we cover"
              title="Airports we cover"
              items={[
                ...(airports.data ?? []).map((airport) => ({
                  id: airport.id,
                  content: <AirportCard airport={airport} />,
                })),
                {
                  id: 'see-all',
                  content: (
                    <Link
                      to={ROUTES.coverage}
                      className="group flex h-full flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 transition-all duration-300 hover:shadow-card-hover"
                    >
                      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 transition group-hover:bg-primary-100">
                        <ArrowRight className="h-5 w-5 text-primary-700" aria-hidden />
                      </span>
                      <span className="text-sm font-semibold text-primary-700">
                        See all UK airports
                      </span>
                    </Link>
                  ),
                },
              ]}
            />
          )}
        </div>
      </section>

      {/* 5 — Choose your ride */}
      <section className="bg-white py-16">
        <div className="container-page">
          {vehicles.isLoading ? (
            <div className="flex gap-5 overflow-hidden">
              {Array.from({ length: 5 }).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <Skeleton key={index} className="h-64 w-48 flex-shrink-0 sm:w-64" />
              ))}
            </div>
          ) : (
            <Carousel
              label="Vehicle fleet"
              title="Choose your ride"
              subtitle="Starting prices based on distance"
              itemClassName="w-48 sm:w-64"
              items={(vehicles.data ?? []).map((vehicle) => ({
                id: vehicle.id,
                content: <VehicleCard vehicle={vehicle} />,
              }))}
            />
          )}
        </div>
      </section>

      {/* 6 — FAQs */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-center text-xl font-bold text-gray-900 sm:mb-8 sm:text-3xl">
            Frequently Asked Questions
          </h2>

          {faqs.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <Accordion
              items={(faqs.data ?? []).map((faq) => ({
                id: faq.id,
                question: faq.question,
                answer: faq.answer,
              }))}
            />
          )}

          <div className="mt-8 text-center">
            <ButtonLink to={ROUTES.help} variant="outline">
              Visit the help centre
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}

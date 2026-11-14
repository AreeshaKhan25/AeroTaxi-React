import { ArrowRight, Mail, MapPin, Plane } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHero } from '@/components/common/PageHero';
import { ButtonLink } from '@/components/ui/Button';
import { Alert, Skeleton } from '@/components/ui/Surface';
import { useAirports } from '@/hooks/useCatalog';
import { ROUTES } from '@/lib/site';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function CoveragePage() {
  usePageTitle('Transfer coverage');
  const { data: airports, isLoading, isError } = useAirports();

  return (
    <>
      <PageHero
        title="Airports"
        subtitle="Book reliable airport transfers to and from all major UK airports"
        align="center"
      />

      <section className="bg-gray-50 py-12 lg:py-16">
        <div className="container-page">
          <div className="mb-10 flex items-center gap-3">
            <span className="text-3xl" aria-hidden>
              🇬🇧
            </span>
            <h2 className="text-2xl font-bold text-gray-900">United Kingdom</h2>
            {airports && (
              <span className="ml-auto text-sm text-gray-400">{airports.length} airports</span>
            )}
          </div>

          {isError && (
            <Alert tone="danger" title="We could not load the airport list">
              Please refresh the page or try again shortly.
            </Alert>
          )}

          {isLoading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <Skeleton key={index} className="h-72 w-full" />
              ))}
            </div>
          )}

          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(airports ?? []).map((airport) => (
              <li
                key={airport.id}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all duration-300 hover:shadow-card-hover"
              >
                <div className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                  <div className="absolute inset-0 bg-primary/[0.03] transition-colors group-hover:bg-primary/[0.06]" />
                  {airport.image ? (
                    <img
                      src={airport.image}
                      alt={airport.name}
                      loading="lazy"
                      className="relative z-10 max-h-full max-w-[80%] object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
                      <Plane className="h-6 w-6 text-primary-700" aria-hidden />
                    </span>
                  )}
                </div>

                <div className="p-5">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold leading-tight text-gray-900">
                      {airport.name}
                    </h3>
                    <span className="flex-shrink-0 rounded-md bg-gray-100 px-2 py-1 text-xs font-bold text-gray-500">
                      {airport.code}
                    </span>
                  </div>
                  <p className="mb-3 flex items-center gap-1 text-sm text-gray-400">
                    <MapPin className="h-3 w-3" aria-hidden />
                    {airport.city}, {airport.country}
                  </p>
                  <p className="text-sm leading-relaxed text-gray-500">{airport.description}</p>

                  <Link
                    to={ROUTES.home}
                    className="group/link mt-4 flex items-center gap-2 text-sm font-semibold text-primary-700 transition-colors hover:text-primary-600"
                  >
                    Book a transfer
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1"
                      aria-hidden
                    />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-lightgreen py-14">
        <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-3 text-2xl font-bold text-gray-900">Can&rsquo;t find your airport?</h2>
          <p className="mb-6 text-gray-600">
            Contact our support team and we&rsquo;ll do our best to arrange a transfer for you.
          </p>
          <ButtonLink to={ROUTES.helpContact} size="lg">
            <Mail className="h-4 w-4" aria-hidden />
            Contact us
          </ButtonLink>
        </div>
      </section>
    </>
  );
}

import { Compass, Home, LifeBuoy, Search } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ROUTES } from '@/lib/site';

const SUGGESTIONS = [
  { to: ROUTES.home, label: 'Book a transfer', icon: Home },
  { to: ROUTES.coverage, label: 'Airports we cover', icon: Compass },
  { to: ROUTES.lookup, label: 'Find my booking', icon: Search },
  { to: ROUTES.help, label: 'Help Centre', icon: LifeBuoy },
];

export default function NotFoundPage() {
  usePageTitle('Page not found');

  return (
    <section className="flex min-h-[70vh] items-center bg-cream py-16">
      <div className="container-narrow text-center">
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-primary-700">
          Error 404
        </p>
        <h1 className="mb-4 text-4xl font-bold text-gray-900 sm:text-5xl">
          We took a wrong turn
        </h1>
        <p className="mx-auto mb-9 max-w-xl text-gray-600">
          The page you were looking for does not exist, or it may have moved. Let&rsquo;s get you
          back on route.
        </p>

        <ButtonLink to={ROUTES.home} size="lg">
          <Home className="h-4 w-4" aria-hidden /> Back to home
        </ButtonLink>

        <ul className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          {SUGGESTIONS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <ButtonLink to={to} variant="outline" fullWidth className="bg-white">
                <Icon className="h-4 w-4" aria-hidden /> {label}
              </ButtonLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

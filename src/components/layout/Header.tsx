import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Ticket, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MAIN_NAV, ROUTES, SITE } from '@/lib/site';

function Logo({ className }: { className?: string }) {
  return (
    <Link
      to={ROUTES.home}
      aria-label={`${SITE.name} home`}
      className={cn('flex flex-shrink-0 items-center', className)}
    >
      <img src="/images/logo.png" alt="" aria-hidden className="h-8 w-auto sm:h-10 md:h-14" />
      <img
        src="/images/logo2.png"
        alt={SITE.name}
        className="ml-1 h-12 w-auto sm:ml-2 sm:h-14 md:h-20"
      />
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  const isActive = (to: string) => {
    const [path] = to.split('#');
    if (path === ROUTES.home) return location.pathname === ROUTES.home;
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <nav aria-label="Main" className="mx-auto w-full max-w-7xl px-3 sm:px-4">
        <div className="flex h-16 items-center justify-between md:h-20">
          <Logo />

          <div className="hidden items-center gap-8 md:flex">
            {MAIN_NAV.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={cn(
                  'text-sm transition-colors',
                  isActive(item.to)
                    ? 'font-semibold text-primary-700'
                    : 'text-gray-600 hover:text-primary-700',
                )}
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to={ROUTES.lookup}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
            >
              <Ticket className="h-3.5 w-3.5 text-gray-400" aria-hidden />
              My booking
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 transition hover:text-primary-700 md:hidden"
          >
            {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
          </button>
        </div>

        <div
          id="mobile-menu"
          className={cn(
            'grid overflow-hidden transition-all duration-300 md:hidden',
            open ? 'grid-rows-[1fr] pb-4 opacity-100' : 'grid-rows-[0fr] opacity-0',
          )}
        >
          <div className="space-y-1 overflow-hidden">
            {MAIN_NAV.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={cn(
                  'block rounded-md px-3 py-2.5',
                  isActive(item.to)
                    ? 'bg-primary-50 font-semibold text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary-700',
                )}
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to={ROUTES.lookup}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-primary-700"
            >
              <Ticket className="h-4 w-4 text-gray-400" aria-hidden /> My booking
            </NavLink>
          </div>
        </div>
      </nav>
    </header>
  );
}

import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { FOOTER_NAV, ROUTES, SITE } from '@/lib/site';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-12">
        <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
          <div>
            <Link to={ROUTES.home} className="mb-4 flex items-center" aria-label={`${SITE.name} home`}>
              <img src="/images/logo.png" alt="" aria-hidden className="h-8 w-auto sm:h-10 md:h-14" />
              <img
                src="/images/logo2.png"
                alt={SITE.name}
                className="ml-1 h-12 w-auto sm:ml-2 sm:h-14 md:h-20"
              />
            </Link>
            <p className="text-xs leading-relaxed text-gray-400 sm:text-sm">{SITE.tagline}</p>
            <a
              href={`mailto:${SITE.supportEmail}`}
              className="mt-3 inline-flex items-center gap-2 break-all text-xs text-gray-400 transition-colors hover:text-accent sm:mt-4 sm:text-sm"
            >
              <Mail className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
              {SITE.supportEmail}
            </a>
          </div>

          {FOOTER_NAV.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="mb-3 text-sm font-semibold sm:mb-4 sm:text-lg">{column.heading}</h2>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-xs text-gray-400 transition-colors hover:text-accent sm:text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-6 border-t border-gray-800 pt-4 text-center sm:mt-10 sm:pt-6">
          <p className="text-xs text-gray-500 sm:text-sm">
            &copy; {new Date().getFullYear()} {SITE.legalName}. All rights reserved.
          </p>
          <p className="mt-1 text-[11px] text-gray-600">{SITE.address.inline}</p>
        </div>
      </div>
    </footer>
  );
}

import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { SITE } from '@/lib/site';
import { Footer } from './Footer';
import { Header } from './Header';

/** Scrolls to `#hash` targets once the page has painted, else to the top. */
function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const id = hash.slice(1);
    const frame = window.requestAnimationFrame(() => {
      const element = document.getElementById(id);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname, hash]);

  return null;
}

/** Loads the Tawk.to widget once, lazily, after the page is interactive. */
function LiveChat() {
  useEffect(() => {
    if (!SITE.tawkToId) return;
    if (document.getElementById('tawk-script')) return;

    const inject = () => {
      const script = document.createElement('script');
      script.id = 'tawk-script';
      script.async = true;
      script.src = `https://embed.tawk.to/${SITE.tawkToId}`;
      script.charset = 'UTF-8';
      script.setAttribute('crossorigin', '*');
      document.body.appendChild(script);
    };

    const timer = window.setTimeout(inject, 2500);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}

export function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-card"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ScrollManager />
      <LiveChat />
    </div>
  );
}

/** Single source of truth for routes, brand copy and contact details. */

export const ROUTES = {
  home: '/',
  coverage: '/coverage',
  help: '/help',
  helpContact: '/help#contact-us',
  helpFaqs: '/help#faqs',
  helpMyBooking: '/help#my-booking',
  yourRide: '/your-ride',
  transferDetails: '/transfer-details',
  payment: '/payment',
  confirmation: (reference: string) => `/booking/confirmation/${encodeURIComponent(reference)}`,
  lookup: '/booking/lookup',
  terms: '/terms-of-service',
  privacyPolicy: '/privacy-policy',
  privacyStatement: '/privacy-statement',
  cookiePolicy: '/cookie-policy',
  admin: {
    login: '/admin/login',
    dashboard: '/admin',
    jobs: '/admin/jobs',
    unpaid: '/admin/bookings',
    booking: (id: number | string) => `/admin/bookings/${id}`,
    fleet: '/admin/fleet',
    zones: '/admin/zones-map',
    messages: '/admin/contact-messages',
    promotions: '/admin/promotions',
    subscribers: '/admin/subscribers',
  },
} as const;

export const SITE = {
  name: 'AeroTAXI',
  legalName: 'AeroTAXI LLC',
  tagline: 'Connecting you to the best and affordable taxi services around the world.',
  supportEmail: 'supportaerotaxi@gmail.com',
  address: {
    lines: ['1111B S Governors Ave STE 26937', 'Dover, DE 19904, US'],
    inline: '1111B S Governors Ave STE 26937, Dover, DE 19904, US',
  },
  companyFileNumber: '10104688',
  /** Tawk.to live-chat widget from the original site. */
  tawkToId: '69cdfcdcbe444a1c3a7ffc6f/1jl6a7g5l',
} as const;

export const MAIN_NAV = [
  { label: 'Home', to: ROUTES.home },
  { label: 'Coverage', to: ROUTES.coverage },
  { label: 'Contact us', to: ROUTES.helpContact },
  { label: 'Help', to: ROUTES.help },
] as const;

export const FOOTER_NAV = [
  {
    heading: 'Quick Links',
    links: [
      { label: 'Coverage', to: ROUTES.coverage },
      { label: 'Book a transfer', to: ROUTES.home },
      { label: 'My booking', to: ROUTES.lookup },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Help Centre', to: ROUTES.help },
      { label: 'FAQs', to: ROUTES.helpFaqs },
      { label: 'Contact Us', to: ROUTES.helpContact },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Terms of Service', to: ROUTES.terms },
      { label: 'Privacy Statement', to: ROUTES.privacyStatement },
      { label: 'Privacy Policy', to: ROUTES.privacyPolicy },
      { label: 'Cookie Policy', to: ROUTES.cookiePolicy },
    ],
  },
] as const;

export const BOOKING_STEPS = ['Your ride', 'Transfer details', 'Payment'] as const;

export const INCLUDED_FEATURES = [
  'Meet & Greet included',
  'Free flight tracking',
  'Free cancellation (24h)',
  '24/7 customer support',
] as const;

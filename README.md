# AeroTAXI — React + TypeScript

A full rebuild of the original Laravel/Blade AeroTAXI site as a modern React single-page
application backed by a small Express + SQLite API. Every page, flow and admin screen from
the original has been carried over — the booking funnel, live pricing, flight validation,
Stripe checkout, confirmation emails, the legal pages and the whole admin panel — with the
markup rewritten as typed React components and the Alpine.js behaviour replaced by hooks.

```
src/        React front end (Vite, TypeScript, Tailwind)
server/     Express API, SQLite storage, mailer, Stripe
public/     Static assets copied from the original site
```

## Quick start

```bash
npm install          # installs the web + API dependencies
cp .env.example .env # optional: everything works without it
npm run db:seed      # creates server/data/aerotaxi.sqlite with airports, fleet, FAQs, admin
npm run dev          # Vite on :5173 and the API on :4000
```

Then open <http://localhost:5173>. The admin panel is at
<http://localhost:5173/admin> — the seeded account is `admin@aerotaxi.com` / `admin123`
(change `SEED_ADMIN_*` in `.env` before the first seed, or change the password afterwards).

Vite proxies `/api` to the API server, so the front end never needs an absolute URL.

### Scripts

| Script             | What it does                                                        |
| ------------------ | ------------------------------------------------------------------- |
| `npm run dev`      | Front end and API together, both watching                           |
| `npm run dev:web`  | Vite only                                                           |
| `npm run dev:api`  | API only (`tsx watch`)                                              |
| `npm run build`    | Type-checks every project, then builds `dist/`                      |
| `npm start`        | Production mode: serves the API **and** `dist/` from one process    |
| `npm run db:seed`  | Idempotent seed — safe to re-run, never overwrites existing rows    |
| `npm run db:reset` | Drops the tables and re-seeds from scratch                          |
| `npm run lint`     | `tsc -b` across the app, Node and server projects                   |

## Configuration

Nothing is required to run locally; each integration degrades gracefully.

| Area       | Without configuration                                                     | With configuration                                        |
| ---------- | ------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Stripe** | Checkout runs in **demo mode**: the payment step confirms the booking without charging a card. | `STRIPE_PUBLISHABLE_KEY` + `STRIPE_SECRET_KEY` switch the payment page to real Stripe Elements, and the server verifies the PaymentIntent before confirming. |
| **Email**  | Confirmation, admin-notification and promotion emails are logged to the API console. | `MAIL_*` SMTP settings send them for real. Mail failures never break a booking. |
| **Flights**| Flight numbers are validated against a built-in UK airline IATA directory. | `AVIATIONSTACK_API_KEY` adds live flight lookup, with the directory as the fallback. |

Sessions are signed JWTs in an httpOnly cookie (`JWT_SECRET`, `SESSION_DAYS`,
`REMEMBER_DAYS`). Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## The booking flow

1. **Home** (`/`) — search form with airport + address autocomplete (our airport list first,
   then OpenStreetMap/Nominatim), a two-tab date/time picker, swap button, airport and
   vehicle carousels, and the FAQ accordion.
2. **Your ride** (`/your-ride`) — the route is drawn with Leaflet and measured with OSRM
   (straight-line fallback if OSRM is unreachable), then every vehicle is priced for that
   distance and the choice is kept in the URL so the page can be shared or reloaded.
3. **Transfer details** (`/transfer-details`) — flight validation, passenger/luggage
   counters capped by the chosen vehicle, lead-passenger details with a country dial-code
   picker, and the optional extras.
4. **Payment** (`/payment?reference=…`) — Stripe Elements or demo mode; confirming is
   idempotent, so a double submit cannot double-charge or re-send emails.
5. **Confirmation** (`/booking/confirmation/:reference`) — printable summary; the same
   component powers the public lookup at `/booking/lookup`.

Pricing is a faithful port of the original lookup table: 17 distance bands × 7 vehicles,
interpolated between bands and extrapolated past the last one with each vehicle's long-haul
per-mile rate, plus the standard 1.5-mile local-roads allowance
(`src/lib/pricing.ts`).

## Admin panel

| Route                     | Screen                                                              |
| ------------------------- | ------------------------------------------------------------------- |
| `/admin`                  | Stats: totals, revenue, status/vehicle breakdowns, 14-day revenue bars, subscribers, recent bookings |
| `/admin/jobs`             | Every booking, with the original seven filters and quick stats       |
| `/admin/bookings`         | Unpaid bookings only                                                 |
| `/admin/bookings/:id`     | Full editor — journey, passenger, vehicle/price, status/payment      |
| `/admin/fleet`            | The fleet with its rate card and per-vehicle booking counts          |
| `/admin/zones-map`        | Draw service-area polygons on the map; **these now persist** (the original lost them on reload) |
| `/admin/contact-messages` | Inbox with search, unread filter and read/unread toggle              |
| `/admin/promotions`       | Send a promotion to active subscribers, plus the send history        |
| `/admin/subscribers`      | Subscriber list with activate/deactivate and CSV export              |

The notification bell polls `/api/admin/notifications` once a minute and marks everything
read in one request.

## API

All endpoints are under `/api`. Public: `config`, `airports`, `vehicles`, `faqs`,
`flights/validate`, `bookings` (create / get / lookup / payment-intent / confirm),
`contact`, `subscribers`. Admin (cookie-authenticated): `admin/login`, `logout`, `me`,
`stats`, `summary`, `bookings`, `bookings/:id`, `fleet`, `contact-messages`, `subscribers`,
`promotions`, `notifications`, `zones`. Every request body is validated with Zod and
failures come back as `422` with per-field messages, which the forms map onto their inputs.

## Notes on the port

- **No Alpine, no jQuery, no CDN Tailwind.** Tailwind is compiled, icons come from
  `lucide-react` instead of FontAwesome, and the brand palette, fonts, shadows and
  animations live in `tailwind.config.js`.
- **Data lives in SQLite** instead of MySQL; the schema, the 12 airports, 7 vehicles and 5
  FAQs match the original seeders exactly.
- **Accessibility and robustness passes**: keyboard-navigable autocomplete and accordions,
  labelled controls, a skip link, focus-visible rings, loading skeletons, toasts for async
  results, and route-level code splitting.
- **The legal pages** are stored as structured content in `src/content/legal.ts` and
  rendered with a tiny inline-markup helper, so the wording stays easy to diff. The text
  follows the original, with one correction: the live-chat passages named Intercom while the
  site actually embeds Tawk.to, so they now describe Tawk.to and the cookies it really sets
  (`tawk_uuid_propertyId`, `twk_idm_key`, `TawkConnectionTime`), per tawk.to's own cookie
  documentation.

# AeroTAXI — React + TypeScript

A full rebuild of the original Laravel/Blade AeroTAXI site as a modern React single-page
application backed by an Express + Postgres API. Every page, flow and admin screen from
the original has been carried over — the booking funnel, live pricing, flight validation,
Stripe checkout, confirmation emails, the legal pages and the whole admin panel — with the
markup rewritten as typed React components and the Alpine.js behaviour replaced by hooks.

```
src/        React front end (Vite, TypeScript, Tailwind)
server/     Express API, Postgres data layer, mailer, Stripe
api/        Vercel Function wrapper that serves the same Express app
public/     Static assets copied from the original site
```

It runs the same way in both places: one Express app, either as a long-lived Node process
or as a single Vercel Function.

## Quick start

```bash
npm install            # installs the web + API dependencies
cp .env.example .env   # set DATABASE_URL to your Postgres instance
npm run db:seed        # creates the schema and seeds airports, fleet, FAQs, admin
npm run dev            # Vite on :5173 and the API on :4000
```

Any Postgres works — a local server, Docker (`docker run -e POSTGRES_PASSWORD=postgres -p
5432:5432 postgres:17`), Neon, or Supabase. The connection string goes in `DATABASE_URL`.

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

| Area         | Without configuration                                                   | With configuration                                        |
| ------------ | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| **Database** | Falls back to `postgresql://postgres:postgres@localhost:5432/aerotaxi`, so the API will not start unless something is listening there. | `DATABASE_URL` (or `POSTGRES_URL`) points at any Postgres. TLS is enabled automatically for anything that is not localhost. |
| **Stripe**   | Checkout runs in **demo mode**: the payment step confirms the booking without charging a card. | `STRIPE_PUBLISHABLE_KEY` + `STRIPE_SECRET_KEY` switch the payment page to real Stripe Elements, and the server verifies the PaymentIntent before confirming. |
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

## Deploying to Vercel

The whole app ships as one Vercel project: the Vite build is served from the CDN, and the
Express API runs as a single function (`api/index.ts`), which `vercel.json` rewrites every
`/api/*` request to. Client-side routes fall back to `index.html`.

1. **Create the database.** In the Vercel dashboard, open the project's *Storage* tab and
   create a Neon Postgres store. Vercel injects `DATABASE_URL` into every environment, so
   the app needs no further database configuration.
2. **Set the secrets.** Only one is required:

   ```bash
   vercel env add JWT_SECRET production   # paste a 48-byte random hex string
   vercel env add APP_URL production      # https://your-deployment.vercel.app
   ```

   `STRIPE_*`, `MAIL_*` and `AVIATIONSTACK_API_KEY` are optional — without them checkout
   runs in demo mode, email is logged, and flight lookup uses the offline airline list.
   The seed account's password is **not** a deployment secret: it is only read by
   `npm run db:seed`, so keep it in your local `.env` and out of the hosting environment.
3. **Create the schema.** Point your local `.env` at the Neon connection string (copy it
   from the Storage tab) and run `npm run db:seed` once. It creates the tables, loads the
   airports, fleet and FAQs, and creates the admin account from `SEED_ADMIN_*`.
4. **Deploy.** `vercel --prod`, or push to the connected Git branch.

The function keeps one pooled connection per instance (`DATABASE_POOL_MAX` defaults to 1 on
Vercel) and never runs migrations on a cold start, so scaling up does not stampede the
database.

## Notes on the port

- **No Alpine, no jQuery, no CDN Tailwind.** Tailwind is compiled, icons come from
  `lucide-react` instead of FontAwesome, and the brand palette, fonts, shadows and
  animations live in `tailwind.config.js`.
- **Data lives in Postgres** instead of MySQL; the schema, the 12 airports, 7 vehicles and
  5 FAQs match the original seeders exactly. The repositories are plain async SQL with a
  small named-parameter helper — no ORM — and bookings join their vehicle in one query
  rather than looking it up per row.
- **Accessibility and robustness passes**: keyboard-navigable autocomplete and accordions,
  labelled controls, a skip link, focus-visible rings, loading skeletons, toasts for async
  results, and route-level code splitting.
- **The legal pages** are stored as structured content in `src/content/legal.ts` and
  rendered with a tiny inline-markup helper, so the wording stays easy to diff. The text
  follows the original, with one correction: the live-chat passages named Intercom while the
  site actually embeds Tawk.to, so they now describe Tawk.to and the cookies it really sets
  (`tawk_uuid_propertyId`, `twk_idm_key`, `TawkConnectionTime`), per tawk.to's own cookie
  documentation.

import { Router } from 'express';
import { env, hasStripe } from '../env.js';
import { asyncHandler } from '../lib/http.js';
import { airports, faqs, vehicles } from '../lib/repositories.js';
import { mailerConfigured } from '../mail/mailer.js';

export const catalogRouter = Router();

/** Runtime configuration the React app needs on boot. */
catalogRouter.get('/config', (_req, res) => {
  res.json({
    stripePublishableKey: hasStripe() ? env.stripe.publishableKey : null,
    stripeEnabled: hasStripe(),
    mailEnabled: mailerConfigured(),
    supportEmail: env.mail.fromAddress,
    appUrl: env.appUrl,
  });
});

catalogRouter.get('/airports', (req, res) => {
  const query = typeof req.query.q === 'string' ? req.query.q : '';
  const limitParam = Number.parseInt(String(req.query.limit ?? ''), 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : undefined;

  if (query || limit) {
    res.json(airports.search(query, limit ?? 10));
    return;
  }

  res.json(airports.all());
});

catalogRouter.get('/vehicles', (_req, res) => {
  res.json(vehicles.all());
});

catalogRouter.get('/vehicles/:id', (req, res) => {
  const vehicle = vehicles.find(Number(req.params.id));
  if (!vehicle) {
    res.status(404).json({ message: 'Vehicle not found' });
    return;
  }
  res.json(vehicle);
});

catalogRouter.get('/faqs', (_req, res) => {
  res.json(faqs.all());
});

/* ------------------------------------------------------- flight lookup */

const AIRLINES: Record<string, string> = {
  BA: 'British Airways',
  EZY: 'easyJet',
  U2: 'easyJet',
  FR: 'Ryanair',
  VS: 'Virgin Atlantic',
  LS: 'Jet2',
  MT: 'Thomas Cook',
  TOM: 'TUI',
  BY: 'TUI Airways',
  BE: 'Flybe',
  LM: 'Loganair',
  EI: 'Aer Lingus',
  LH: 'Lufthansa',
  AF: 'Air France',
  KL: 'KLM',
  AA: 'American Airlines',
  UA: 'United Airlines',
  DL: 'Delta',
  EK: 'Emirates',
  QR: 'Qatar Airways',
  TK: 'Turkish Airlines',
  SQ: 'Singapore Airlines',
  CX: 'Cathay Pacific',
  NH: 'ANA',
  IB: 'Iberia',
  AZ: 'ITA Airways',
  SK: 'SAS',
  AY: 'Finnair',
  TP: 'TAP Portugal',
  LX: 'Swiss',
  OS: 'Austrian',
  SN: 'Brussels Airlines',
  W6: 'Wizz Air',
  W9: 'Wizz Air UK',
  ZT: 'Titan Airways',
  RK: 'Ryanair UK',
};

interface AviationstackFlight {
  flight_status?: string;
  departure?: { airport?: string; scheduled?: string };
  arrival?: { airport?: string; scheduled?: string };
  airline?: { name?: string };
}

const parseFlightNumber = (value: string): { airline: string; number: string } | null => {
  const normalised = value.trim().toUpperCase().replace(/\s+/g, '');
  const match =
    /^([A-Z\d]{2})(\d{1,5})$/.exec(normalised) ?? /^([A-Z]{3})(\d{1,5})$/.exec(normalised);
  if (!match) return null;
  return { airline: match[1], number: match[2] };
};

const toTime = (iso?: string): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

catalogRouter.get(
  '/flights/validate',
  asyncHandler(async (req, res) => {
    const raw = typeof req.query.flightNumber === 'string' ? req.query.flightNumber : '';
    const date =
      typeof req.query.date === 'string' && req.query.date
        ? req.query.date
        : new Date().toISOString().slice(0, 10);

    const flightNumber = raw.trim().toUpperCase().replace(/\s+/g, '');
    if (!flightNumber) {
      res.json({ found: false, reason: 'missing' });
      return;
    }

    const parsed = parseFlightNumber(flightNumber);
    if (!parsed) {
      res.json({ found: false, reason: 'invalid-format' });
      return;
    }

    /* Live lookup when an AviationStack key is available. */
    if (env.aviationstackKey) {
      try {
        const url = new URL('http://api.aviationstack.com/v1/flights');
        url.searchParams.set('access_key', env.aviationstackKey);
        url.searchParams.set('flight_iata', flightNumber);
        url.searchParams.set('date', date);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (response.ok) {
          const payload = (await response.json()) as { data?: AviationstackFlight[] };
          const flight = payload.data?.[0];
          if (flight) {
            const airline = flight.airline?.name ?? AIRLINES[parsed.airline] ?? parsed.airline;
            const departure = flight.departure?.airport ?? 'Unknown';
            const arrival = flight.arrival?.airport ?? 'Unknown';
            const departsAt = toTime(flight.departure?.scheduled);
            const status = flight.flight_status ?? '';

            let info = `${airline} ${flightNumber} · ${departure} → ${arrival}`;
            if (departsAt) info += ` · Departs ${departsAt}`;
            if (status) info += ` · Status: ${status.charAt(0).toUpperCase()}${status.slice(1)}`;

            res.json({
              found: true,
              source: 'aviationstack',
              info,
              airline,
              departureAirport: departure,
              arrivalAirport: arrival,
              scheduledDeparture: flight.departure?.scheduled ?? null,
              status: status || null,
            });
            return;
          }
          res.json({ found: false, reason: 'not-found', source: 'aviationstack' });
          return;
        }
      } catch {
        /* Fall through to the offline airline-code check. */
      }
    }

    const airline = AIRLINES[parsed.airline];
    if (airline) {
      res.json({
        found: true,
        source: 'airline-directory',
        info: `${airline} flight ${flightNumber} · Date: ${date}`,
        airline,
      });
      return;
    }

    res.json({ found: false, reason: 'unknown-airline' });
  }),
);

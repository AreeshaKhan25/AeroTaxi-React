import { Router } from 'express';
import { z } from 'zod';
import { env } from '../env.js';
import { HttpError, asyncHandler, parseOrThrow } from '../lib/http.js';
import { bookings, notifications, subscribers, vehicles } from '../lib/repositories.js';
import { getStripe, toMinorUnits } from '../lib/stripe.js';
import type { BookingDto } from '../lib/types.js';
import { sendMail } from '../mail/mailer.js';
import { adminBookingNotificationEmail, bookingConfirmationEmail } from '../mail/templates.js';

export const bookingsRouter = Router();

const extraSchema = z.object({
  id: z.string().min(1).max(60),
  label: z.string().min(1).max(120),
  price: z.number().min(0).max(10_000),
});

const createBookingSchema = z.object({
  fromLocation: z.string().trim().min(2, 'Pickup location is required').max(500),
  toLocation: z.string().trim().min(2, 'Drop-off location is required').max(500),
  departDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a departure date')
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Pick a valid departure date'),
  departTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Pick a departure time')
    .nullable()
    .optional(),
  vehicleId: z.coerce.number().int().positive('Choose a vehicle'),
  firstName: z.string().trim().min(1, 'First name is required').max(120),
  lastName: z.string().trim().min(1, 'Last name is required').max(120),
  email: z.string().trim().email('Enter a valid email address').max(255),
  phone: z.string().trim().min(5, 'Enter a valid phone number').max(50),
  countryCode: z.string().trim().max(10).nullable().optional(),
  flightNumber: z.string().trim().max(20).nullable().optional(),
  noteToDriver: z.string().trim().max(500).nullable().optional(),
  passengers: z.coerce.number().int().min(1).max(16).default(1),
  suitcases: z.coerce.number().int().min(0).max(16).default(0),
  handLuggage: z.coerce.number().int().min(0).max(16).default(0),
  extras: z.array(extraSchema).max(12).default([]),
  distance: z.string().trim().max(60).nullable().optional(),
  duration: z.string().trim().max(60).nullable().optional(),
  totalPrice: z.coerce.number().min(0).max(100_000).optional(),
  agreePromotions: z.boolean().default(false),
});

const referenceParam = z
  .string()
  .trim()
  .min(4)
  .max(32)
  .transform((value) => value.toUpperCase());

/** Price is recomputed server-side: vehicle minimum + declared extras. */
const resolveTotal = (
  requested: number | undefined,
  vehiclePrice: number,
  extras: { price: number }[],
): number => {
  const extrasTotal = extras.reduce((sum, extra) => sum + extra.price, 0);
  const floor = vehiclePrice + extrasTotal;
  const total = requested !== undefined && requested >= floor ? requested : floor;
  return Math.round(total * 100) / 100;
};

bookingsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = parseOrThrow(createBookingSchema, req.body);

    const vehicle = await vehicles.find(input.vehicleId);
    if (!vehicle) throw HttpError.unprocessable('That vehicle is no longer available.');

    if (input.passengers > vehicle.passengers) {
      throw HttpError.unprocessable('The given data was invalid', {
        passengers: `${vehicle.name} seats up to ${vehicle.passengers} passengers.`,
      });
    }

    const passengerName = `${input.firstName} ${input.lastName}`.trim();
    const booking = await bookings.create({
      fromLocation: input.fromLocation,
      toLocation: input.toLocation,
      departDate: input.departDate,
      departTime: input.departTime ?? null,
      vehicleId: vehicle.id,
      passengerName,
      email: input.email,
      phone: input.phone,
      countryCode: input.countryCode ?? null,
      flightNumber: input.flightNumber ? input.flightNumber.toUpperCase() : null,
      noteToDriver: input.noteToDriver ?? null,
      passengers: input.passengers,
      suitcases: input.suitcases,
      handLuggage: input.handLuggage,
      extras: input.extras,
      distance: input.distance ?? null,
      duration: input.duration ?? null,
      totalPrice: resolveTotal(input.totalPrice, vehicle.price, input.extras),
    });

    if (input.agreePromotions) {
      const { created } = await subscribers.firstOrCreate(input.email, passengerName);
      if (created) {
        await notifications.create('subscriber', `New subscriber: ${input.email}`, {
          email: input.email,
        });
      }
    }

    res.status(201).json(booking);
  }),
);

bookingsRouter.get(
  '/lookup',
  asyncHandler(async (req, res) => {
    const raw = typeof req.query.reference === 'string' ? req.query.reference.trim() : '';
    if (!raw) {
      res.json({ reference: '', booking: null });
      return;
    }

    const reference = raw.toUpperCase();
    const booking = (await bookings.findByReference(reference)) ?? null;
    res.json({ reference, booking });
  }),
);

bookingsRouter.get(
  '/:reference',
  asyncHandler(async (req, res) => {
    const reference = parseOrThrow(referenceParam, req.params.reference);
    const booking = await bookings.findByReference(reference);
    if (!booking) throw HttpError.notFound('Booking not found');
    res.json(booking);
  }),
);

/**
 * Creates (or reuses) the PaymentIntent for a booking. In demo mode — no Stripe
 * keys configured — responds with `{ demo: true }` so the UI can simulate a
 * successful checkout without charging anything.
 */
bookingsRouter.post(
  '/:reference/payment-intent',
  asyncHandler(async (req, res) => {
    const reference = parseOrThrow(referenceParam, req.params.reference);
    const booking = await bookings.findByReference(reference);
    if (!booking) throw HttpError.notFound('Booking not found');

    if (booking.paymentStatus === 'paid') {
      res.json({ demo: false, alreadyPaid: true, clientSecret: null });
      return;
    }

    const stripe = getStripe();
    if (!stripe) {
      res.json({ demo: true, clientSecret: null });
      return;
    }

    const amount = toMinorUnits(booking.totalPrice);
    const metadata = {
      booking_reference: booking.reference,
      from: booking.fromLocation.slice(0, 450),
      to: booking.toLocation.slice(0, 450),
    };

    /* Reuse an existing intent when it is still payable for the same amount. */
    if (booking.paymentId?.startsWith('pi_')) {
      try {
        const existing = await stripe.paymentIntents.retrieve(booking.paymentId);
        const reusable =
          existing.amount === amount &&
          ['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(
            existing.status,
          );
        if (reusable && existing.client_secret) {
          res.json({ demo: false, clientSecret: existing.client_secret });
          return;
        }
      } catch {
        /* Intent no longer retrievable — create a fresh one below. */
      }
    }

    const intent = await stripe.paymentIntents.create({
      amount,
      currency: 'gbp',
      metadata,
      automatic_payment_methods: { enabled: true },
      description: `AeroTAXI transfer ${booking.reference}`,
      receipt_email: booking.email ?? undefined,
    });

    await bookings.update(booking.id, {
      fromLocation: booking.fromLocation,
      toLocation: booking.toLocation,
      departDate: booking.departDate,
      departTime: booking.departTime,
      vehicleId: booking.vehicleId,
      passengerName: booking.passengerName ?? '',
      email: booking.email ?? '',
      phone: booking.phone,
      countryCode: booking.countryCode,
      flightNumber: booking.flightNumber,
      noteToDriver: booking.noteToDriver,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentId: intent.id,
      totalPrice: booking.totalPrice,
    });

    res.json({ demo: false, clientSecret: intent.client_secret });
  }),
);

async function notifyBookingConfirmed(booking: BookingDto): Promise<void> {
  await notifications.create(
    'booking',
    `New booking ${booking.reference} from ${booking.passengerName ?? 'a customer'}`,
    { bookingId: booking.id, reference: booking.reference },
  );

  const customerEmail = booking.email;
  const tasks: Promise<unknown>[] = [];

  if (customerEmail) {
    const mail = bookingConfirmationEmail(booking);
    tasks.push(sendMail({ to: customerEmail, ...mail }));
  }

  if (env.mail.adminRecipients.length) {
    const mail = adminBookingNotificationEmail(booking);
    tasks.push(sendMail({ to: env.mail.adminRecipients, ...mail }));
  }

  await Promise.allSettled(tasks);
}

/**
 * Marks a booking as paid. Idempotent: calling it again on an already confirmed
 * booking simply returns the booking without re-sending email.
 */
bookingsRouter.post(
  '/:reference/confirm',
  asyncHandler(async (req, res) => {
    const reference = parseOrThrow(referenceParam, req.params.reference);
    const booking = await bookings.findByReference(reference);
    if (!booking) throw HttpError.notFound('Booking not found');

    if (booking.paymentStatus === 'paid') {
      res.json({ booking, alreadyConfirmed: true });
      return;
    }

    const paymentIntentId =
      typeof req.body?.paymentIntentId === 'string' ? req.body.paymentIntentId : booking.paymentId;

    const stripe = getStripe();
    let confirmedPaymentId = paymentIntentId ?? null;

    if (stripe) {
      if (!paymentIntentId) {
        throw HttpError.badRequest('No payment was found for this booking.');
      }

      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (intent.metadata?.booking_reference && intent.metadata.booking_reference !== booking.reference) {
        throw HttpError.badRequest('That payment does not belong to this booking.');
      }

      if (intent.status !== 'succeeded') {
        res.status(409).json({
          message: 'Payment has not completed yet.',
          paymentStatus: intent.status,
          booking,
        });
        return;
      }

      confirmedPaymentId = intent.id;
    }

    const updated = await bookings.markPaid(booking.id, confirmedPaymentId);
    if (!updated) throw HttpError.serverError('Booking could not be confirmed');

    await notifyBookingConfirmed(updated);

    res.json({ booking: updated, alreadyConfirmed: false });
  }),
);

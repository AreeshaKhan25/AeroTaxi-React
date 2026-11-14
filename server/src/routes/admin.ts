import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { HttpError, asyncHandler, parseOrThrow } from '../lib/http.js';
import {
  admins,
  bookings,
  contactMessages,
  notifications,
  promotions,
  subscribers,
  vehicles,
  zones,
} from '../lib/repositories.js';
import { clearAdminCookie, issueAdminCookie, requireAdmin } from '../middleware/auth.js';
import { sendMail } from '../mail/mailer.js';
import { promotionEmail } from '../mail/templates.js';

export const adminRouter = Router();

/* ------------------------------------------------------------------ auth */

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Please try again later.' },
});

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
  remember: z.boolean().default(false),
});

adminRouter.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const input = parseOrThrow(loginSchema, req.body);
    const admin = admins.findByEmail(input.email);

    const matches = admin ? await bcrypt.compare(input.password, admin.password) : false;
    if (!admin || !matches) {
      throw HttpError.unprocessable('The given data was invalid', {
        email: 'The provided credentials do not match our records.',
      });
    }

    const identity = { id: admin.id, name: admin.name, email: admin.email };
    issueAdminCookie(res, identity, input.remember);
    res.json({ admin: identity });
  }),
);

adminRouter.post('/logout', (_req, res) => {
  clearAdminCookie(res);
  res.json({ message: 'Signed out' });
});

adminRouter.get('/me', (req, res) => {
  if (!req.admin) {
    res.status(401).json({ admin: null });
    return;
  }
  res.json({ admin: req.admin });
});

/* Everything below requires an authenticated admin. */
adminRouter.use(requireAdmin);

/* ----------------------------------------------------------- dashboard */

adminRouter.get('/stats', (_req, res) => {
  res.json({
    ...bookings.stats(),
    subscribers: subscribers.all(),
    activeSubscribers: subscribers.activeCount(),
    unreadMessages: contactMessages.unreadCount(),
    recentBookings: bookings.recent(10),
  });
});

adminRouter.get('/summary', (_req, res) => {
  res.json({
    unreadNotifications: notifications.unreadCount(),
    unreadMessages: contactMessages.unreadCount(),
  });
});

/* ------------------------------------------------------------ bookings */

adminRouter.get('/bookings', (req, res) => {
  const scope = req.query.scope === 'unpaid' ? 'unpaid' : 'all';
  res.json(scope === 'unpaid' ? bookings.unpaid() : bookings.all());
});

adminRouter.get('/bookings/:id', (req, res) => {
  const booking = bookings.findById(Number(req.params.id));
  if (!booking) {
    res.status(404).json({ message: 'Booking not found' });
    return;
  }
  res.json(booking);
});

const updateBookingSchema = z.object({
  fromLocation: z.string().trim().min(2, 'Pickup location is required').max(500),
  toLocation: z.string().trim().min(2, 'Drop-off location is required').max(500),
  departDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a departure date'),
  departTime: z
    .union([z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM'), z.literal('')])
    .nullable()
    .optional(),
  vehicleId: z.coerce.number().int().positive('Choose a vehicle'),
  passengerName: z.string().trim().min(1, 'Passenger name is required').max(255),
  email: z.string().trim().email('Enter a valid email address').max(255),
  phone: z.string().trim().max(50).nullable().optional(),
  countryCode: z.string().trim().max(10).nullable().optional(),
  flightNumber: z.string().trim().max(20).nullable().optional(),
  noteToDriver: z.string().trim().max(500).nullable().optional(),
  status: z.enum(['new', 'confirmed', 'pending', 'completed', 'cancelled', 'assigned', 'bidding']),
  paymentStatus: z.enum(['unpaid', 'paid', 'refunded']),
  paymentId: z.string().trim().max(255).nullable().optional(),
  totalPrice: z.coerce.number().min(0, 'Price cannot be negative').max(100_000),
});

adminRouter.put(
  '/bookings/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = bookings.findById(id);
    if (!existing) throw HttpError.notFound('Booking not found');

    const input = parseOrThrow(updateBookingSchema, req.body);
    if (!vehicles.find(input.vehicleId)) {
      throw HttpError.unprocessable('The given data was invalid', {
        vehicleId: 'Choose an available vehicle.',
      });
    }

    const updated = bookings.update(id, {
      fromLocation: input.fromLocation,
      toLocation: input.toLocation,
      departDate: input.departDate,
      departTime: input.departTime ? input.departTime : null,
      vehicleId: input.vehicleId,
      passengerName: input.passengerName,
      email: input.email,
      phone: input.phone ?? null,
      countryCode: input.countryCode ?? null,
      flightNumber: input.flightNumber ? input.flightNumber.toUpperCase() : null,
      noteToDriver: input.noteToDriver ?? null,
      status: input.status,
      paymentStatus: input.paymentStatus,
      paymentId: input.paymentId ?? null,
      totalPrice: input.totalPrice,
    });

    res.json({ message: 'Booking updated successfully.', booking: updated });
  }),
);

/* ---------------------------------------------------------------- fleet */

adminRouter.get('/fleet', (_req, res) => {
  const list = vehicles.all();
  const usage = bookings.stats().byVehicle;
  res.json(
    list.map((vehicle) => ({
      ...vehicle,
      bookingCount: usage.find((entry) => entry.name === vehicle.name)?.count ?? 0,
    })),
  );
});

/* ------------------------------------------------------------- messages */

adminRouter.get('/contact-messages', (_req, res) => {
  res.json(contactMessages.all());
});

const readSchema = z.object({ read: z.boolean().default(true) });

adminRouter.patch(
  '/contact-messages/:id',
  asyncHandler(async (req, res) => {
    const input = parseOrThrow(readSchema, req.body ?? {});
    const message = contactMessages.markRead(Number(req.params.id), input.read);
    if (!message) throw HttpError.notFound('Message not found');
    res.json({ message: input.read ? 'Message marked as read.' : 'Message marked as unread.', contactMessage: message });
  }),
);

/* ---------------------------------------------------------- subscribers */

adminRouter.get('/subscribers', (_req, res) => {
  res.json(subscribers.all());
});

adminRouter.patch(
  '/subscribers/:id',
  asyncHandler(async (req, res) => {
    const input = parseOrThrow(z.object({ active: z.boolean() }), req.body ?? {});
    const subscriber = subscribers.setActive(Number(req.params.id), input.active);
    if (!subscriber) throw HttpError.notFound('Subscriber not found');
    res.json({ subscriber });
  }),
);

/* ----------------------------------------------------------- promotions */

const promotionSchema = z.object({
  subject: z.string().trim().min(3, 'Add a subject line').max(200),
  message: z.string().trim().min(10, 'Write your promotional message').max(10_000),
});

adminRouter.get('/promotions', (_req, res) => {
  res.json({
    promotions: promotions.recent(),
    subscribers: subscribers.all(),
    activeSubscribers: subscribers.activeCount(),
  });
});

adminRouter.post(
  '/promotions',
  asyncHandler(async (req, res) => {
    const input = parseOrThrow(promotionSchema, req.body);
    const recipients = subscribers.activeEmails();

    if (!recipients.length) {
      throw HttpError.unprocessable('There are no active subscribers to send to.');
    }

    const results = await Promise.allSettled(
      recipients.map((recipient) => {
        const mail = promotionEmail({
          subject: input.subject,
          message: input.message,
          recipientName: recipient.name,
        });
        return sendMail({ to: recipient.email, ...mail });
      }),
    );

    const sent = results.filter(
      (result) => result.status === 'fulfilled' && result.value.sent,
    ).length;

    const promotion = promotions.create({
      subject: input.subject,
      message: input.message,
      recipientCount: recipients.length,
      sentCount: sent,
      status: sent === recipients.length ? 'sent' : sent === 0 ? 'queued' : 'partial',
    });

    notifications.create('system', `Promotion "${input.subject}" processed for ${recipients.length} subscribers`, {
      promotionId: promotion.id,
    });

    res.status(201).json({
      message:
        sent > 0
          ? `Promotion "${input.subject}" sent to ${sent} of ${recipients.length} subscribers.`
          : `Promotion "${input.subject}" queued for ${recipients.length} subscribers (SMTP is not configured).`,
      promotion,
    });
  }),
);

/* -------------------------------------------------------- notifications */

adminRouter.get('/notifications', (req, res) => {
  const limitParam = Number.parseInt(String(req.query.limit ?? ''), 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 25;
  res.json({
    notifications: notifications.recent(limit),
    unreadCount: notifications.unreadCount(),
  });
});

adminRouter.post('/notifications/mark-read', (_req, res) => {
  notifications.markAllRead();
  res.json({ unreadCount: 0 });
});

/* ---------------------------------------------------------------- zones */

const zoneSchema = z.object({
  name: z.string().trim().min(1, 'Name the zone').max(120),
  colour: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour')
    .default('#f59e0b'),
  geometry: z.array(z.tuple([z.number(), z.number()])).min(3, 'A zone needs at least three points'),
});

adminRouter.get('/zones', (_req, res) => {
  res.json(zones.all());
});

adminRouter.post(
  '/zones',
  asyncHandler(async (req, res) => {
    const input = parseOrThrow(zoneSchema, req.body);
    res.status(201).json(zones.create(input));
  }),
);

adminRouter.delete(
  '/zones/:id',
  asyncHandler(async (req, res) => {
    const removed = zones.remove(Number(req.params.id));
    if (!removed) throw HttpError.notFound('Zone not found');
    res.json({ message: 'Zone deleted' });
  }),
);

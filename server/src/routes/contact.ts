import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { asyncHandler, parseOrThrow } from '../lib/http.js';
import { contactMessages, notifications, subscribers } from '../lib/repositories.js';
import { sendMail } from '../mail/mailer.js';
import { contactReceiptEmail } from '../mail/templates.js';
import { env } from '../env.js';

export const contactRouter = Router();

const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many messages sent. Please try again in a few minutes.' },
});

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please tell us your name').max(120),
  email: z.string().trim().email('Enter a valid email address').max(255),
  subject: z.string().trim().max(200).nullable().optional(),
  message: z.string().trim().min(10, 'Please add a little more detail').max(5000),
});

contactRouter.post(
  '/contact',
  contactLimiter,
  asyncHandler(async (req, res) => {
    const input = parseOrThrow(contactSchema, req.body);

    const message = await contactMessages.create({
      name: input.name,
      email: input.email,
      subject: input.subject ?? null,
      message: input.message,
    });

    await notifications.create(
      'contact',
      `New contact message from ${input.name} - ${input.subject ?? 'No subject'}`,
      { contactMessageId: message.id },
    );

    const receipt = contactReceiptEmail({
      name: input.name,
      subject: input.subject ?? null,
      message: input.message,
    });

    await Promise.allSettled([
      sendMail({ to: input.email, ...receipt }),
      env.mail.adminRecipients.length
        ? sendMail({
            to: env.mail.adminRecipients,
            subject: `New contact message from ${input.name}`,
            html: receipt.html,
            text: `${input.name} <${input.email}>\n\n${input.message}`,
          })
        : Promise.resolve(),
    ]);

    res.status(201).json({
      message: 'Your message has been sent successfully!',
      contactMessage: message,
    });
  }),
);

const subscribeSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(255),
  name: z.string().trim().max(120).nullable().optional(),
});

contactRouter.post(
  '/subscribers',
  contactLimiter,
  asyncHandler(async (req, res) => {
    const input = parseOrThrow(subscribeSchema, req.body);
    const { subscriber, created } = await subscribers.firstOrCreate(
      input.email,
      input.name ?? null,
    );

    if (created) {
      await notifications.create('subscriber', `New subscriber: ${subscriber.email}`, {
        email: subscriber.email,
      });
    }

    res.status(created ? 201 : 200).json({
      message: created ? 'You are subscribed. Watch this space for offers!' : 'You are already subscribed.',
      subscriber,
      created,
    });
  }),
);

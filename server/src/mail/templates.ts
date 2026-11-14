import { env } from '../env.js';
import type { BookingDto } from '../lib/types.js';

const BRAND = {
  accent: '#FACC15',
  accentSoft: '#fef9c3',
  ink: '#111827',
  muted: '#6b7280',
  faint: '#9ca3af',
  line: '#f3f4f6',
  border: '#e5e7eb',
  page: '#f3f4f6',
  surface: '#f9fafb',
  success: '#16a34a',
  successSoft: '#f0fdf4',
  primary: '#0C6291',
};

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const money = (value: number): string =>
  `&pound;${Number(value || 0).toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** "Monday, 3 March 2026" from a `YYYY-MM-DD` string, without timezone drift. */
const longDate = (iso: string): string => {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  const date = new Date(Date.UTC(year, month - 1, day));
  return `${WEEKDAYS[date.getUTCDay()]}, ${day} ${MONTHS[month - 1]} ${year}`;
};

const timestamp = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getDate()} ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getFullYear()}, ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

const shell = (heading: string, headingBg: string, headingColour: string, body: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${BRAND.page};font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${BRAND.page};padding:40px 20px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
            <tr>
              <td style="background-color:${headingBg};padding:28px 40px;text-align:center;">
                <h1 style="margin:0;font-size:22px;color:${headingColour};font-weight:bold;letter-spacing:0.5px;">${escapeHtml(heading)}</h1>
              </td>
            </tr>
            ${body}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const detailRow = (label: string, value: string, last = false): string => `
  <tr>
    <td style="padding:14px 20px;${last ? '' : `border-bottom:1px solid ${BRAND.line};`}">
      <span style="font-size:11px;color:${BRAND.faint};text-transform:uppercase;letter-spacing:1px;">${escapeHtml(label)}</span><br />
      <span style="font-size:14px;color:${BRAND.ink};font-weight:600;">${value}</span>
    </td>
  </tr>`;

const labelledRow = (label: string, value: string, last = false): string => `
  <tr>
    <td style="padding:12px 16px;background-color:${BRAND.surface};width:130px;${last ? '' : `border-bottom:1px solid ${BRAND.line};`}">
      <span style="font-size:12px;color:${BRAND.muted};font-weight:600;">${escapeHtml(label)}</span>
    </td>
    <td style="padding:12px 16px;${last ? '' : `border-bottom:1px solid ${BRAND.line};`}">
      <span style="font-size:14px;color:${BRAND.ink};">${value}</span>
    </td>
  </tr>`;

const departLine = (booking: BookingDto): string =>
  `${escapeHtml(longDate(booking.departDate))}${booking.departTime ? ` at ${escapeHtml(booking.departTime)}` : ''}`;

const vehicleLine = (booking: BookingDto): string => {
  const name = escapeHtml(booking.vehicle?.name ?? 'N/A');
  const model = booking.vehicle?.carModel
    ? ` <span style="color:${BRAND.faint};font-weight:400;">(${escapeHtml(booking.vehicle.carModel)})</span>`
    : '';
  return `${name}${model}`;
};

const extrasLine = (booking: BookingDto): string => {
  if (!booking.extras.length) return 'None';
  return booking.extras
    .map((extra) =>
      extra.price > 0
        ? `${escapeHtml(extra.label)} (${money(extra.price)})`
        : `${escapeHtml(extra.label)} (free)`,
    )
    .join(', ');
};

export function bookingConfirmationEmail(booking: BookingDto): {
  subject: string;
  html: string;
  text: string;
} {
  const body = `
    <tr>
      <td style="padding:38px 40px 18px;text-align:center;">
        <div style="width:58px;height:58px;line-height:58px;border-radius:50%;background-color:#dcfce7;margin:0 auto 16px;">
          <span style="font-size:26px;color:${BRAND.success};">&#10003;</span>
        </div>
        <h2 style="margin:0 0 8px;font-size:22px;color:${BRAND.ink};">Booking Confirmed!</h2>
        <p style="margin:0;color:${BRAND.muted};font-size:14px;">Your airport transfer has been booked successfully.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:10px 40px 30px;text-align:center;">
        <div style="display:inline-block;background-color:${BRAND.accentSoft};border:2px solid ${BRAND.accent};border-radius:12px;padding:12px 24px;">
          <span style="font-size:12px;color:${BRAND.muted};">Booking Reference</span><br />
          <span style="font-size:20px;font-weight:bold;color:${BRAND.ink};letter-spacing:2px;">${escapeHtml(booking.reference)}</span>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
          ${detailRow('From', escapeHtml(booking.fromLocation))}
          ${detailRow('To', escapeHtml(booking.toLocation))}
          ${detailRow('Date &amp; Time', departLine(booking))}
          ${detailRow('Vehicle', vehicleLine(booking))}
          ${detailRow('Passengers', `${booking.passengers} passenger${booking.passengers === 1 ? '' : 's'} &middot; ${booking.suitcases} suitcase${booking.suitcases === 1 ? '' : 's'} &middot; ${booking.handLuggage} hand luggage`)}
          ${booking.flightNumber ? detailRow('Flight', escapeHtml(booking.flightNumber)) : ''}
          ${detailRow('Optional extras', extrasLine(booking))}
          ${detailRow('Passenger', escapeHtml(booking.passengerName ?? ''))}
          ${detailRow('Total Paid', `<span style="font-size:20px;font-weight:bold;">${money(booking.totalPrice)}</span>`, true)}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:${BRAND.successSoft};border-radius:12px;">
          <tr>
            <td style="padding:16px 20px;font-size:13px;color:#15803d;line-height:22px;">
              &#10003; Meet &amp; Greet included &nbsp;&nbsp; &#10003; Free flight tracking &nbsp;&nbsp;
              &#10003; Free cancellation (24h) &nbsp;&nbsp; &#10003; 24/7 support
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 28px;">
        <h3 style="margin:0 0 12px;font-size:16px;color:${BRAND.ink};">Important Information</h3>
        <ul style="margin:0;padding-left:20px;color:${BRAND.muted};font-size:13px;line-height:22px;">
          <li>Your driver will track your flight automatically for delays.</li>
          <li>Please arrive at the pickup point on time.</li>
          <li>For airport pickups, your driver will be waiting in the arrivals hall with a name board.</li>
          <li>To amend or cancel, visit our website or email ${escapeHtml(env.mail.fromAddress)}.</li>
          <li>Free cancellation up to 24 hours before your scheduled pickup.</li>
        </ul>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 32px;text-align:center;">
        <a href="${env.appUrl}/booking/lookup?reference=${encodeURIComponent(booking.reference)}"
           style="display:inline-block;background-color:${BRAND.accent};color:${BRAND.ink};font-weight:600;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:14px;">
          Manage My Booking
        </a>
      </td>
    </tr>
    <tr>
      <td style="background-color:${BRAND.surface};padding:24px 40px;text-align:center;border-top:1px solid ${BRAND.border};">
        <p style="margin:0 0 8px;font-size:13px;color:${BRAND.muted};">
          Need help? Contact us at
          <a href="mailto:${escapeHtml(env.mail.fromAddress)}" style="color:${BRAND.primary};text-decoration:none;">${escapeHtml(env.mail.fromAddress)}</a>
        </p>
        <p style="margin:0;font-size:11px;color:${BRAND.faint};">
          &copy; ${new Date().getFullYear()} AeroTAXI LLC. All rights reserved.<br />
          1111B S Governors Ave STE 26937, Dover, DE 19904, US
        </p>
      </td>
    </tr>`;

  const text = [
    `Booking confirmed - ${booking.reference}`,
    '',
    `From: ${booking.fromLocation}`,
    `To: ${booking.toLocation}`,
    `Depart: ${longDate(booking.departDate)}${booking.departTime ? ` at ${booking.departTime}` : ''}`,
    `Vehicle: ${booking.vehicle?.name ?? 'N/A'}`,
    `Passenger: ${booking.passengerName ?? ''}`,
    `Total paid: GBP ${booking.totalPrice.toFixed(2)}`,
    '',
    `Manage your booking: ${env.appUrl}/booking/lookup?reference=${booking.reference}`,
  ].join('\n');

  return {
    subject: `Booking Confirmed - ${booking.reference} | AeroTAXI`,
    html: shell('AeroTAXI', BRAND.accent, BRAND.ink, body),
    text,
  };
}

export function adminBookingNotificationEmail(booking: BookingDto): {
  subject: string;
  html: string;
  text: string;
} {
  const body = `
    <tr>
      <td style="padding:30px 40px 20px;">
        <div style="background-color:${BRAND.accentSoft};border:2px solid ${BRAND.accent};border-radius:12px;padding:16px 20px;">
          <h2 style="margin:0 0 4px;font-size:18px;color:${BRAND.ink};">&#128230; New Booking Received</h2>
          <p style="margin:0;font-size:14px;color:${BRAND.muted};">A new transfer has been booked and paid for.</p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:10px 40px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
          <tr>
            <td style="font-size:12px;color:${BRAND.faint};">REFERENCE</td>
            <td align="right" style="font-size:12px;color:${BRAND.faint};">BOOKED AT</td>
          </tr>
          <tr>
            <td style="font-size:18px;color:${BRAND.ink};font-weight:bold;letter-spacing:1px;">${escapeHtml(booking.reference)}</td>
            <td align="right" style="font-size:14px;color:${BRAND.ink};">${escapeHtml(timestamp(booking.createdAt))}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 20px;">
        <h3 style="margin:0 0 12px;font-size:13px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:1px;">Journey Details</h3>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
          ${labelledRow('From', escapeHtml(booking.fromLocation))}
          ${labelledRow('To', escapeHtml(booking.toLocation))}
          ${labelledRow('Date &amp; Time', departLine(booking))}
          ${labelledRow('Vehicle', vehicleLine(booking))}
          ${labelledRow('Flight', escapeHtml(booking.flightNumber ?? '—'))}
          ${labelledRow('Distance', `${escapeHtml(booking.distance ?? '—')} &middot; ${escapeHtml(booking.duration ?? '—')}`)}
          ${labelledRow('Extras', extrasLine(booking), true)}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 20px;">
        <h3 style="margin:0 0 12px;font-size:13px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:1px;">Customer Details</h3>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
          ${labelledRow('Name', escapeHtml(booking.passengerName ?? ''))}
          ${labelledRow(
            'Email',
            `<a href="mailto:${escapeHtml(booking.email ?? '')}" style="color:${BRAND.primary};">${escapeHtml(booking.email ?? '')}</a>`,
          )}
          ${labelledRow(
            'Phone',
            `<a href="tel:${escapeHtml(`${booking.countryCode ?? ''}${booking.phone ?? ''}`)}" style="color:${BRAND.primary};">${escapeHtml(`${booking.countryCode ?? ''} ${booking.phone ?? ''}`)}</a>`,
          )}
          ${labelledRow('Note to driver', escapeHtml(booking.noteToDriver ?? '—'), true)}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 30px;">
        <div style="background-color:${BRAND.successSoft};border-radius:12px;padding:18px 20px;text-align:center;">
          <span style="font-size:12px;color:${BRAND.muted};text-transform:uppercase;letter-spacing:1px;">Amount Charged</span><br />
          <span style="font-size:28px;font-weight:bold;color:${BRAND.ink};">${money(booking.totalPrice)}</span><br />
          <span style="font-size:12px;color:${BRAND.success};">&#10003; Payment confirmed</span>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:0 40px 32px;text-align:center;">
        <a href="${env.appUrl}/admin/bookings/${booking.id}"
           style="display:inline-block;background-color:${BRAND.ink};color:#ffffff;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;">
          Open in admin panel
        </a>
      </td>
    </tr>
    <tr>
      <td style="background-color:${BRAND.surface};padding:20px 40px;text-align:center;border-top:1px solid ${BRAND.border};">
        <p style="margin:0;font-size:11px;color:${BRAND.faint};">
          This is an automated notification from AeroTAXI.<br />
          &copy; ${new Date().getFullYear()} AeroTAXI LLC.
        </p>
      </td>
    </tr>`;

  const text = [
    `New booking ${booking.reference}`,
    `${booking.fromLocation} -> ${booking.toLocation}`,
    `${longDate(booking.departDate)}${booking.departTime ? ` at ${booking.departTime}` : ''}`,
    `Passenger: ${booking.passengerName ?? ''} (${booking.email ?? ''}, ${booking.countryCode ?? ''} ${booking.phone ?? ''})`,
    `Vehicle: ${booking.vehicle?.name ?? 'N/A'}`,
    `Total: GBP ${booking.totalPrice.toFixed(2)}`,
  ].join('\n');

  return {
    subject: `New Booking Received - ${booking.reference}`,
    html: shell('AeroTAXI — Admin', BRAND.ink, BRAND.accent, body),
    text,
  };
}

export function promotionEmail(input: {
  subject: string;
  message: string;
  recipientName?: string | null;
}): { subject: string; html: string; text: string } {
  const paragraphs = input.message
    .split(/\n{2,}/)
    .map(
      (block) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#374151;">${escapeHtml(
          block,
        ).replace(/\n/g, '<br />')}</p>`,
    )
    .join('');

  const body = `
    <tr>
      <td style="padding:34px 40px 10px;">
        <h2 style="margin:0 0 18px;font-size:21px;color:${BRAND.ink};">${escapeHtml(input.subject)}</h2>
        ${input.recipientName ? `<p style="margin:0 0 16px;font-size:15px;color:#374151;">Hi ${escapeHtml(input.recipientName)},</p>` : ''}
        ${paragraphs}
      </td>
    </tr>
    <tr>
      <td style="padding:8px 40px 34px;text-align:center;">
        <a href="${env.appUrl}"
           style="display:inline-block;background-color:${BRAND.accent};color:${BRAND.ink};font-weight:600;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:14px;">
          Book your transfer
        </a>
      </td>
    </tr>
    <tr>
      <td style="background-color:${BRAND.surface};padding:22px 40px;text-align:center;border-top:1px solid ${BRAND.border};">
        <p style="margin:0 0 6px;font-size:12px;color:${BRAND.muted};">
          You are receiving this because you opted in to AeroTAXI offers.
        </p>
        <p style="margin:0;font-size:11px;color:${BRAND.faint};">
          &copy; ${new Date().getFullYear()} AeroTAXI LLC &middot; 1111B S Governors Ave STE 26937, Dover, DE 19904, US
        </p>
      </td>
    </tr>`;

  return {
    subject: input.subject,
    html: shell('AeroTAXI', BRAND.accent, BRAND.ink, body),
    text: input.message,
  };
}

export function contactReceiptEmail(input: {
  name: string;
  subject: string | null;
  message: string;
}): { subject: string; html: string; text: string } {
  const body = `
    <tr>
      <td style="padding:34px 40px 30px;">
        <h2 style="margin:0 0 14px;font-size:20px;color:${BRAND.ink};">Thanks for getting in touch</h2>
        <p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#374151;">
          Hi ${escapeHtml(input.name)}, we have received your message and a member of our team will reply
          within one working day.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
          ${detailRow('Subject', escapeHtml(input.subject ?? 'No subject'))}
          ${detailRow('Your message', escapeHtml(input.message).replace(/\n/g, '<br />'), true)}
        </table>
      </td>
    </tr>
    <tr>
      <td style="background-color:${BRAND.surface};padding:20px 40px;text-align:center;border-top:1px solid ${BRAND.border};">
        <p style="margin:0;font-size:11px;color:${BRAND.faint};">&copy; ${new Date().getFullYear()} AeroTAXI LLC.</p>
      </td>
    </tr>`;

  return {
    subject: 'We received your message | AeroTAXI',
    html: shell('AeroTAXI', BRAND.accent, BRAND.ink, body),
    text: `Hi ${input.name}, we have received your message and will reply within one working day.`,
  };
}

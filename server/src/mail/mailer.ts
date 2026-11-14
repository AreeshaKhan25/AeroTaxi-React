import nodemailer, { type Transporter } from 'nodemailer';
import { env, hasMailer } from '../env.js';

export interface MailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!hasMailer()) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.secure || env.mail.port === 465,
    auth: env.mail.user ? { user: env.mail.user, pass: env.mail.password } : undefined,
  });

  return transporter;
}

/**
 * Sends an email when SMTP is configured; otherwise logs a preview so local
 * development never blocks on mail credentials. Never throws — the caller's
 * request must not fail because a notification could not go out.
 */
export async function sendMail(message: MailMessage): Promise<{ sent: boolean; error?: string }> {
  const recipients = Array.isArray(message.to) ? message.to.filter(Boolean) : [message.to];
  if (!recipients.length) return { sent: false, error: 'No recipients' };

  const mailer = getTransporter();
  if (!mailer) {
    console.info(
      `[mail] SMTP not configured — skipped "${message.subject}" to ${recipients.join(', ')}`,
    );
    return { sent: false, error: 'SMTP not configured' };
  }

  try {
    await mailer.sendMail({
      from: `"${env.mail.fromName}" <${env.mail.fromAddress}>`,
      to: recipients.join(', '),
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    console.info(`[mail] sent "${message.subject}" to ${recipients.join(', ')}`);
    return { sent: true };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error(`[mail] failed "${message.subject}": ${detail}`);
    return { sent: false, error: detail };
  }
}

export const mailerConfigured = hasMailer;

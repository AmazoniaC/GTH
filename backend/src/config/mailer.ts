import nodemailer, { Transporter } from 'nodemailer';
import { env, isMailConfigured } from './env';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!isMailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  attachments?: MailAttachment[];
}

/** Envía un correo. Lanza si el SMTP no está configurado. */
export async function sendMail(input: MailInput): Promise<void> {
  const tx = getTransporter();
  if (!tx) {
    throw new Error('El envío de correos no está configurado (SMTP). Define las variables SMTP_* en el .env.');
  }
  await tx.sendMail({
    from: `"${env.smtp.fromName}" <${env.smtp.from}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    attachments: input.attachments,
  });
}

export { isMailConfigured };

// backend/utils/mailer.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function sendResetEmail(to: string, message: string): Promise<void> {
  const html = `
    <p>${message}</p>
    <p>Si no solicitaste esto, ignora este mensaje.</p>
  `;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: 'Recuperación de contraseña',
    html,
  });
}

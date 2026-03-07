import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: `PharmaLink <${env.EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    logger.info(`Email sent to ${options.to}`);
  } catch (error) {
    logger.error('Email sending error:', error);
    // Don't throw - email failures shouldn't break the flow
  }
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await sendEmail({
    to: email,
    subject: 'Password Reset - PharmaLink',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:white;text-decoration:none;border-radius:6px;">Reset Password</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });
};

export const sendOrderConfirmationEmail = async (
  email: string,
  orderId: string,
  pharmacyName: string
): Promise<void> => {
  await sendEmail({
    to: email,
    subject: 'Order Confirmed - PharmaLink',
    html: `
      <h2>Order Confirmed!</h2>
      <p>Your order <strong>#${orderId}</strong> has been confirmed by <strong>${pharmacyName}</strong>.</p>
      <p>You can track your order status in the app.</p>
    `,
  });
};

export const sendPharmacyVerificationEmail = async (
  email: string,
  pharmacyName: string,
  approved: boolean,
  reason?: string
): Promise<void> => {
  const subject = approved ? 'Pharmacy Verified!' : 'Pharmacy Verification Update';
  const content = approved
    ? `<p>Congratulations! Your pharmacy <strong>${pharmacyName}</strong> has been verified. You can now receive orders.</p>`
    : `<p>Unfortunately, your pharmacy <strong>${pharmacyName}</strong> verification was not approved.</p><p>Reason: ${reason || 'N/A'}</p>`;

  await sendEmail({
    to: email,
    subject: `${subject} - PharmaLink`,
    html: `<h2>${subject}</h2>${content}`,
  });
};

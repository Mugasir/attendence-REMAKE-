import twilio from 'twilio';
import { env } from '../config/env';

const hasTwilioConfig = Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER);
const client = hasTwilioConfig ? twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN) : null;

export const sendOtpSms = async (phoneNumber: string, otp: string): Promise<void> => {
  const body = `SU Attend verification code: ${otp}. It expires in ${env.OTP_EXPIRY_MINUTES} minutes.`;

  if (!client || !env.TWILIO_FROM_NUMBER) {
    console.warn(`[SMS Fallback] ${phoneNumber}: ${body}`);
    return;
  }

  await client.messages.create({
    body,
    from: env.TWILIO_FROM_NUMBER,
    to: phoneNumber
  });
};

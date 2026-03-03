const twilio = require('twilio');
const env = require('../config/env');

let client = null;
if (env.twilioAccountSid && env.twilioAuthToken) {
  client = twilio(env.twilioAccountSid, env.twilioAuthToken);
}

async function sendOtpSms({ to, otpCode }) {
  if (!client || !env.twilioFromNumber) {
    throw new Error('SMS provider not configured. Set Twilio credentials in environment variables.');
  }

  return client.messages.create({
    body: `Your SU Attend OTP is ${otpCode}. It expires in ${env.otpTtlMinutes} minutes. Do not share this code.`,
    from: env.twilioFromNumber,
    to,
  });
}

module.exports = { sendOtpSms };

const dayjs = require('dayjs');
const prisma = require('../config/prisma');
const { generateOtp } = require('../utils/otp');
const { sendOtpSms } = require('./sms.service');
const env = require('../config/env');

async function createOtpChallenge(studentNumber) {
  const student = await prisma.student.findUnique({ where: { studentNumber } });
  if (!student) {
    return { student: null };
  }

  const otpCode = generateOtp(6);
  const expiresAt = dayjs().add(env.otpTtlMinutes, 'minute').toDate();

  const challenge = await prisma.studentOtpChallenge.create({
    data: {
      studentId: student.id,
      otpCode,
      expiresAt,
    },
  });

  await sendOtpSms({ to: student.phoneNumber, otpCode });

  return { student, challenge };
}

async function verifyOtp(studentNumber, otpCode, action = 'checkin') {
  const student = await prisma.student.findUnique({ where: { studentNumber } });
  if (!student) {
    throw new Error('Student not found');
  }

  const challenge = await prisma.studentOtpChallenge.findFirst({
    where: {
      studentId: student.id,
      otpCode,
      consumedAt: null,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!challenge) {
    throw new Error('Invalid or expired OTP');
  }

  await prisma.studentOtpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });

  if (action === 'checkout') {
    const activeSession = await prisma.attendanceSession.findFirst({
      where: { studentId: student.id, checkOutAt: null },
      orderBy: { checkInAt: 'desc' },
    });

    if (!activeSession) {
      throw new Error('No active attendance session to check out');
    }

    return prisma.attendanceSession.update({
      where: { id: activeSession.id },
      data: { checkOutAt: new Date() },
    });
  }

  return prisma.attendanceSession.create({
    data: {
      studentId: student.id,
      checkInAt: new Date(),
      checkInVerified: true,
    },
  });
}

module.exports = { createOtpChallenge, verifyOtp };

import { AdminRole, OtpStatus } from '@prisma/client';
import { addMinutes, isAfter } from 'date-fns';
import { Router } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { requireAdminAuth, requireRoles } from '../middleware/auth.middleware';
import { sendOtpSms } from '../services/sms.service';
import { compareValue, generateNumericOtp, hashValue } from '../utils/crypto';

export const studentRouter = Router();

studentRouter.post('/', requireAdminAuth, requireRoles(AdminRole.SUPER_ADMIN, AdminRole.STAFF), async (req, res) => {
  const { studentId, fullName, program, intakeYear, studentNumber, phoneNumber, academicEmail, avatarUrl } = req.body;

  const student = await prisma.student.create({
    data: {
      studentId,
      fullName,
      program,
      intakeYear: Number(intakeYear),
      studentNumber,
      phoneNumber,
      academicEmail,
      avatarUrl
    }
  });

  res.status(201).json(student);
});

studentRouter.get('/', requireAdminAuth, async (_req, res) => {
  const students = await prisma.student.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(students);
});

studentRouter.get('/:id/card', requireAdminAuth, async (req, res) => {
  const student = await prisma.student.findUnique({ where: { id: req.params.id } });
  if (!student) {
    res.status(404).json({ message: 'Student not found.' });
    return;
  }

  res.json({
    student,
    card: {
      issuedBy: 'SU Attend',
      barcodeValue: student.studentNumber,
      printableTemplate: `/id-card.html?studentId=${student.id}`
    }
  });
});

studentRouter.post('/check-in/request-otp', async (req, res) => {
  const { studentNumber } = req.body as { studentNumber?: string };
  if (!studentNumber) {
    res.status(400).json({ message: 'Student number is required.' });
    return;
  }

  const student = await prisma.student.findUnique({ where: { studentNumber } });
  if (!student) {
    res.status(404).json({ message: 'Student not registered.' });
    return;
  }

  const otp = generateNumericOtp(env.OTP_LENGTH);
  const codeHash = await hashValue(otp);
  const expiresAt = addMinutes(new Date(), env.OTP_EXPIRY_MINUTES);

  await prisma.otpCode.updateMany({
    where: { studentId: student.id, status: OtpStatus.PENDING },
    data: { status: OtpStatus.EXPIRED }
  });

  await prisma.otpCode.create({
    data: {
      studentId: student.id,
      codeHash,
      expiresAt
    }
  });

  await sendOtpSms(student.phoneNumber, otp);

  res.json({ message: 'OTP sent to registered phone number.', expiresAt });
});

studentRouter.post('/check-in/verify-otp', async (req, res) => {
  const { studentNumber, otp, sessionTag } = req.body as { studentNumber?: string; otp?: string; sessionTag?: string };

  if (!studentNumber || !otp) {
    res.status(400).json({ message: 'Student number and OTP are required.' });
    return;
  }

  const student = await prisma.student.findUnique({ where: { studentNumber } });
  if (!student) {
    res.status(404).json({ message: 'Student not registered.' });
    return;
  }

  const otpRecord = await prisma.otpCode.findFirst({
    where: { studentId: student.id, status: OtpStatus.PENDING },
    orderBy: { createdAt: 'desc' }
  });

  if (!otpRecord || isAfter(new Date(), otpRecord.expiresAt)) {
    if (otpRecord) {
      await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { status: OtpStatus.EXPIRED } });
    }
    res.status(400).json({ message: 'OTP has expired. Request a new code.' });
    return;
  }

  const matched = await compareValue(otp, otpRecord.codeHash);
  if (!matched) {
    res.status(400).json({ message: 'Invalid OTP.' });
    return;
  }

  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { status: OtpStatus.VERIFIED, verifiedAt: new Date() }
  });

  const attendance = await prisma.attendanceLog.create({
    data: {
      studentId: student.id,
      sessionTag: sessionTag || 'default',
      ipAddress: req.ip
    }
  });

  res.status(201).json({ message: 'Check-in successful.', attendance });
});

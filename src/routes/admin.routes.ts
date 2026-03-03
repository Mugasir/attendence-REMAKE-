import { AdminRole } from '@prisma/client';
import { endOfDay, startOfDay } from 'date-fns';
import { Router } from 'express';
import { stringify } from 'csv-stringify/sync';
import ExcelJS from 'exceljs';
import { prisma } from '../config/prisma';
import { requireAdminAuth, requireRoles } from '../middleware/auth.middleware';
import { hashValue } from '../utils/crypto';

export const adminRouter = Router();

adminRouter.use(requireAdminAuth);

adminRouter.get('/me', async (req, res) => {
  const admin = await prisma.admin.findUnique({
    where: { id: req.admin!.id },
    select: { id: true, username: true, fullName: true, role: true, createdAt: true }
  });
  res.json(admin);
});

adminRouter.post('/accounts', requireRoles(AdminRole.SUPER_ADMIN), async (req, res) => {
  const { username, fullName, password, role } = req.body as {
    username: string;
    fullName: string;
    password: string;
    role: AdminRole;
  };

  const passwordHash = await hashValue(password);
  const admin = await prisma.admin.create({
    data: { username, fullName, passwordHash, role }
  });

  res.status(201).json({ id: admin.id, username: admin.username, fullName: admin.fullName, role: admin.role });
});

adminRouter.get('/accounts', requireRoles(AdminRole.SUPER_ADMIN), async (_req, res) => {
  const admins = await prisma.admin.findMany({
    select: { id: true, username: true, fullName: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });

  res.json(admins);
});

adminRouter.get('/dashboard/summary', async (_req, res) => {
  const now = new Date();
  const from = startOfDay(now);
  const to = endOfDay(now);

  const [totalStudents, totalAdmins, todayCheckins, latestLogs] = await Promise.all([
    prisma.student.count(),
    prisma.admin.count(),
    prisma.attendanceLog.count({ where: { checkInAt: { gte: from, lte: to } } }),
    prisma.attendanceLog.findMany({
      take: 30,
      orderBy: { checkInAt: 'desc' },
      include: {
        student: { select: { fullName: true, studentNumber: true, program: true } }
      }
    })
  ]);

  res.json({ totalStudents, totalAdmins, todayCheckins, latestLogs });
});

adminRouter.get('/attendance/export.csv', async (_req, res) => {
  const logs = await prisma.attendanceLog.findMany({
    orderBy: { checkInAt: 'desc' },
    include: { student: true }
  });

  const csv = stringify(
    logs.map((log) => ({
      studentNumber: log.student.studentNumber,
      fullName: log.student.fullName,
      program: log.student.program,
      checkInAt: log.checkInAt.toISOString(),
      sessionTag: log.sessionTag
    })),
    { header: true }
  );

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance.csv"');
  res.send(csv);
});

adminRouter.get('/attendance/export.xlsx', async (_req, res) => {
  const logs = await prisma.attendanceLog.findMany({
    orderBy: { checkInAt: 'desc' },
    include: { student: true }
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Attendance');
  sheet.columns = [
    { header: 'Student Number', key: 'studentNumber', width: 20 },
    { header: 'Full Name', key: 'fullName', width: 32 },
    { header: 'Program', key: 'program', width: 25 },
    { header: 'Check-In Time', key: 'checkInAt', width: 32 },
    { header: 'Session', key: 'sessionTag', width: 18 }
  ];

  logs.forEach((log) => {
    sheet.addRow({
      studentNumber: log.student.studentNumber,
      fullName: log.student.fullName,
      program: log.student.program,
      checkInAt: log.checkInAt.toISOString(),
      sessionTag: log.sessionTag
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

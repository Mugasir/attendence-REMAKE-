const dayjs = require('dayjs');
const { stringify } = require('csv-stringify/sync');
const ExcelJS = require('exceljs');
const prisma = require('../config/prisma');

async function getDashboardMetrics() {
  const start = dayjs().startOf('day').toDate();
  const end = dayjs().endOf('day').toDate();

  const todaysSessions = await prisma.attendanceSession.findMany({
    where: { checkInAt: { gte: start, lte: end } },
    include: { student: true },
    orderBy: { checkInAt: 'desc' },
  });

  const checkedInCount = new Set(todaysSessions.map((s) => s.studentId)).size;

  return {
    checkedInCount,
    todaysSessions,
  };
}

function formatSessionRow(session) {
  const durationMinutes = session.checkOutAt
    ? Math.round((new Date(session.checkOutAt) - new Date(session.checkInAt)) / 60000)
    : null;

  return {
    studentNumber: session.student.studentNumber,
    fullName: session.student.fullName,
    program: session.student.program,
    checkInAt: session.checkInAt.toISOString(),
    checkOutAt: session.checkOutAt ? session.checkOutAt.toISOString() : 'ACTIVE',
    durationMinutes: durationMinutes ?? 'ACTIVE',
  };
}

async function exportAttendanceCsv() {
  const sessions = await prisma.attendanceSession.findMany({
    include: { student: true },
    orderBy: { checkInAt: 'desc' },
  });
  const records = sessions.map(formatSessionRow);
  return stringify(records, { header: true });
}

async function exportAttendanceExcel() {
  const sessions = await prisma.attendanceSession.findMany({
    include: { student: true },
    orderBy: { checkInAt: 'desc' },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Attendance');

  sheet.columns = [
    { header: 'Student Number', key: 'studentNumber', width: 18 },
    { header: 'Full Name', key: 'fullName', width: 30 },
    { header: 'Program', key: 'program', width: 25 },
    { header: 'Check In', key: 'checkInAt', width: 25 },
    { header: 'Check Out', key: 'checkOutAt', width: 25 },
    { header: 'Duration Minutes', key: 'durationMinutes', width: 20 },
  ];

  sessions.map(formatSessionRow).forEach((row) => sheet.addRow(row));

  return workbook.xlsx.writeBuffer();
}

module.exports = { getDashboardMetrics, exportAttendanceCsv, exportAttendanceExcel };

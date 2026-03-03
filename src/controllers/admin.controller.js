const prisma = require('../config/prisma');
const { authenticateAdmin } = require('../services/auth.service');
const { signAdminToken } = require('../utils/jwt');
const { getDashboardMetrics, exportAttendanceCsv, exportAttendanceExcel } = require('../services/admin-dashboard.service');

function getAdminLogin(req, res) {
  return res.render('admin/login', { title: 'SU Attend Admin Login', error: null });
}

async function postAdminLogin(req, res) {
  const { username, password } = req.body;
  const admin = await authenticateAdmin(username, password);
  if (!admin) {
    return res.status(401).render('admin/login', { title: 'SU Attend Admin Login', error: 'Invalid credentials.' });
  }

  const token = signAdminToken(admin);
  res.cookie('admin_token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 12 * 60 * 60 * 1000,
  });

  return res.redirect('/admin/dashboard');
}

function postAdminLogout(req, res) {
  res.clearCookie('admin_token');
  return res.redirect('/admin/login');
}

async function getAdminDashboard(req, res) {
  const [metrics, students] = await Promise.all([
    getDashboardMetrics(),
    prisma.student.findMany({ orderBy: { fullName: 'asc' } }),
  ]);

  return res.render('admin/dashboard', {
    title: 'SU Attend Dashboard',
    admin: req.admin,
    metrics,
    students,
  });
}

async function getStudentDetail(req, res) {
  const student = await prisma.student.findUnique({
    where: { id: req.params.id },
    include: {
      sessions: {
        orderBy: { checkInAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!student) {
    return res.status(404).send('Student not found');
  }

  return res.render('admin/student-detail', {
    title: `${student.fullName} - Student Profile`,
    admin: req.admin,
    student,
  });
}

async function handleCsvExport(req, res) {
  const csv = await exportAttendanceCsv();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance-export.csv"');
  res.send(csv);
}

async function handleExcelExport(req, res) {
  const buffer = await exportAttendanceExcel();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="attendance-export.xlsx"');
  res.send(Buffer.from(buffer));
}

module.exports = {
  getAdminLogin,
  postAdminLogin,
  postAdminLogout,
  getAdminDashboard,
  getStudentDetail,
  handleCsvExport,
  handleExcelExport,
};

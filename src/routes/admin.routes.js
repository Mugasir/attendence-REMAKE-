const express = require('express');
const {
  getAdminLogin,
  postAdminLogin,
  postAdminLogout,
  getAdminDashboard,
  getStudentDetail,
  handleCsvExport,
  handleExcelExport,
} = require('../controllers/admin.controller');
const { getStudentCard } = require('../controllers/student.controller');
const { requireAdminAuth, requireRoles } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/login', getAdminLogin);
router.post('/login', postAdminLogin);
router.post('/logout', requireAdminAuth, postAdminLogout);
router.get('/dashboard', requireAdminAuth, getAdminDashboard);
router.get('/students/:id', requireAdminAuth, getStudentDetail);
router.get('/students/:id/card', requireAdminAuth, getStudentCard);
router.get('/export/csv', requireAdminAuth, handleCsvExport);
router.get('/export/excel', requireAdminAuth, handleExcelExport);
router.get('/roles/manage', requireAdminAuth, requireRoles('SUPER_ADMIN'), async (req, res) => {
  const prisma = require('../config/prisma');
  const admins = await prisma.adminUser.findMany({ orderBy: { createdAt: 'desc' } });
  res.render('admin/roles', { title: 'Admin Roles', admin: req.admin, admins });
});

module.exports = router;

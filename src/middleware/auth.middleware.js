const prisma = require('../config/prisma');
const { verifyToken } = require('../utils/jwt');

async function requireAdminAuth(req, res, next) {
  const token = req.cookies?.admin_token;
  if (!token) {
    return res.redirect('/admin/login');
  }

  try {
    const payload = verifyToken(token);
    const admin = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin || !admin.isActive) {
      return res.redirect('/admin/login');
    }
    req.admin = admin;
    return next();
  } catch (error) {
    return res.redirect('/admin/login');
  }
}

function requireRoles(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).render('admin/forbidden', { title: 'Forbidden', admin: req.admin });
    }
    return next();
  };
}

module.exports = { requireAdminAuth, requireRoles };

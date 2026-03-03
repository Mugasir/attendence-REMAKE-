const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');

async function authenticateAdmin(username, password) {
  const admin = await prisma.adminUser.findUnique({ where: { username } });

  if (!admin || !admin.isActive) {
    return null;
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    return null;
  }

  return admin;
}

module.exports = { authenticateAdmin };

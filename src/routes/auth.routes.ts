import { Router } from 'express';
import { prisma } from '../config/prisma';
import { compareValue } from '../utils/crypto';
import { signAdminToken } from '../services/auth.service';

export const authRouter = Router();

authRouter.post('/admin/login', async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ message: 'Username and password are required.' });
    return;
  }

  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin) {
    res.status(401).json({ message: 'Invalid credentials.' });
    return;
  }

  const isValid = await compareValue(password, admin.passwordHash);
  if (!isValid) {
    res.status(401).json({ message: 'Invalid credentials.' });
    return;
  }

  const token = signAdminToken(admin);

  res.json({
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      fullName: admin.fullName,
      role: admin.role
    }
  });
});

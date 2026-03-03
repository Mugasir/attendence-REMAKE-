import jwt from 'jsonwebtoken';
import { Admin, AdminRole } from '@prisma/client';
import { env } from '../config/env';

export interface AdminTokenPayload {
  sub: string;
  username: string;
  role: AdminRole;
}

export const signAdminToken = (admin: Admin): string =>
  jwt.sign(
    {
      sub: admin.id,
      username: admin.username,
      role: admin.role
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

export const verifyAdminToken = (token: string): AdminTokenPayload =>
  jwt.verify(token, env.JWT_SECRET) as AdminTokenPayload;

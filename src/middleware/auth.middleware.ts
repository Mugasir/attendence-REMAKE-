import { NextFunction, Request, Response } from 'express';
import { AdminRole } from '@prisma/client';
import { verifyAdminToken } from '../services/auth.service';

declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: string;
        username: string;
        role: AdminRole;
      };
    }
  }
}

export const requireAdminAuth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.header('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing bearer token.' });
    return;
  }

  const token = header.replace('Bearer ', '').trim();

  try {
    const payload = verifyAdminToken(token);
    req.admin = {
      id: payload.sub,
      username: payload.username,
      role: payload.role
    };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export const requireRoles = (...roles: AdminRole[]) => (req: Request, res: Response, next: NextFunction): void => {
  if (!req.admin) {
    res.status(401).json({ message: 'Authentication required.' });
    return;
  }

  if (!roles.includes(req.admin.role)) {
    res.status(403).json({ message: 'Insufficient permissions.' });
    return;
  }

  next();
};

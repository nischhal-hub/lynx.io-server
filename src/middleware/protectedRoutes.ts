import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { envConfig } from '../config/config';
import User from '../database/model/user.Model';

// Use string union instead of enum
export type Role = 'admin' | 'user' | 'driver';

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      role: Role;
    }
  }
}

class UserMiddleware {
  public isUserLoggedIn: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      let token: string | undefined;

      const rawAuth = req.headers.authorization;
      if (rawAuth?.startsWith('Bearer ')) {
        token = rawAuth.split(' ')[1];
      } else if (req.cookies?.authToken) {
        token = req.cookies.authToken;
      }

      if (!token) {
        res.status(401).json({ message: 'Authentication token missing' });
        return;
      }

      const decoded = jwt.verify(
        token,
        envConfig.JWT_SECRET!
      ) as JwtPayload & { id: number };

      const userData = await User.findByPk(decoded.id);
      if (!userData) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      req.user = {
        id: userData.id,
        email: userData.email,
        role: userData.roles as Role, // ✅ string union matches directly
      };

      next();
    } catch (err) {
      console.error('JWT Error:', err);
      res.status(401).json({ message: 'Token invalid or expired' });
    }
  };

  public accessTo = (...roles: Role[]): RequestHandler => {
    return (req, res, next): void => {
      const role = req.user?.role;
      if (!role || !roles.includes(role)) {
        res.status(403).json({ message: 'Insufficient permissions' });
        return;
      }
      next();
    };
  };

  public hasRole = (role: Role): RequestHandler => {
    return (req, res, next): void => {
      if (req.user?.role !== role) {
        res.status(403).json({ message: `Requires ${role} role` });
        return;
      }
      next();
    };
  };

  public isOwner = (getResourceOwnerId: (req: Request) => number): RequestHandler => {
    return (req, res, next): void => {
      const ownerId = getResourceOwnerId(req);
      if (req.user?.id !== ownerId) {
        res.status(403).json({ message: 'You do not own this resource' });
        return;
      }
      next();
    };
  };

  public optionalAuth: RequestHandler = async (req, _res, next): Promise<void> => {
    try {
      const rawAuth = req.headers.authorization;
      if (rawAuth?.startsWith('Bearer ')) {
        const token = rawAuth.split(' ')[1];
        const decoded = jwt.verify(token, envConfig.JWT_SECRET!) as JwtPayload & { id: number };

        const userData = await User.findByPk(decoded.id);
        if (userData) {
          req.user = {
            id: userData.id,
            email: userData.email,
            role: userData.roles as Role,
          };
        }
      }
    } catch {
      console.warn('Optional auth failed');
    } finally {
      next();
    }
  };

  private requestCounts: Map<number, number> = new Map();

  public rateLimit = (limit: number, windowMs: number): RequestHandler => {
    return (req, res, next): void => {
      if (!req.user) {
        next();
        return;
      }

      const userId = req.user.id;
      const count = this.requestCounts.get(userId) || 0;

      if (count >= limit) {
        res.status(429).json({ message: 'Too many requests, try later' });
        return;
      }

      this.requestCounts.set(userId, count + 1);

      setTimeout(() => {
        const current = this.requestCounts.get(userId) || 0;
        this.requestCounts.set(userId, Math.max(0, current - 1));
      }, windowMs);

      next();
    };
  };
}

export default new UserMiddleware();

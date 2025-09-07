import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { envConfig } from '../config/config';
import User from '../database/model/user.Model';

export enum Role {
  Admin = 'admin',
  User = 'user',
  Driver = 'driver',
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: Role;
      };
    }
  }
}

class UserMiddleware {
  public isUserLoggedIn: RequestHandler = async (req, res, next) => {
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

    try {
      const decoded = jwt.verify(
        token,
        envConfig.JWT_SECRET!
      ) as jwt.JwtPayload & { id: number };

      const userData = await User.findByPk(decoded.id);
      if (!userData) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      req.user = {
        id: userData.id,
        email: userData.email,
        role: userData.roles as Role,
      };

      next();
    } catch (err) {
      console.error(err);
      res.status(401).json({ message: 'Token invalid or expired' });
    }
  };

  public accessTo = (...roles: Role[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      const role = req.user?.role as Role | undefined;
      if (!role || !roles.includes(role)) {
        res.status(403).json({ message: 'Insufficient permissions' });
        return;
      }
      next();
    };
  };

  // Check if user has a specific role
  public hasRole = (role: Role): RequestHandler => {
    return (req, res, next) => {
      if (req.user?.role !== role) {
        res.status(403).json({ message: `Requires ${role} role` });
        return;
      }
      next();
    };
  };

  // Check if user is owner of a resource
  public isOwner = (getResourceOwnerId: (req: Request) => number): RequestHandler => {
    return (req, res, next) => {
      const ownerId = getResourceOwnerId(req);
      if (req.user?.id !== ownerId) {
        res.status(403).json({ message: 'You do not own this resource' });
        return;
      }
      next();
    };
  };

  // Optional authentication middleware
  public optionalAuth: RequestHandler = async (req, res, next) => {
    try {
      const rawAuth = req.headers.authorization;
      if (rawAuth?.startsWith('Bearer ')) {
        const token = rawAuth.split(' ')[1];
        const decoded = jwt.verify(token, envConfig.JWT_SECRET!) as jwt.JwtPayload & { id: number };
        const userData = await User.findByPk(decoded.id);
        if (userData) {
          req.user = {
            id: userData.id,
            email: userData.email,
            role: userData.roles as Role,
          };
        }
      }
    } catch (err) {
      console.warn('Optional auth failed:', err.message);
    } finally {
      next();
    }
  };

  // Rate limiter per user
  private requestCounts: Map<number, number> = new Map();
  public rateLimit = (limit: number, windowMs: number): RequestHandler => {
    return (req, res, next) => {
      if (!req.user) {
        next();
        return;
      }

      const userId = req.user.id;
      const count = this.requestCounts.get(userId) || 0;

      if (count >= limit) {
        return res.status(429).json({ message: 'Too many requests, try later' });
      }

      this.requestCounts.set(userId, count + 1);
      setTimeout(() => this.requestCounts.set(userId, (this.requestCounts.get(userId) || 1) - 1), windowMs);

      next();
    };
  };
}

export default new UserMiddleware();

import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { envConfig } from '../config/config';
import User from '../database/model/user.Model';

export enum Role {
  Admin = 'admin',
  User = 'user',
  Driver = 'driver',
}

class UserMiddleware {
  public isUserLoggedIn: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    let token: string | undefined;

    // 1. Try Authorization header
    const rawAuth = req.headers.authorization;
    if (rawAuth?.startsWith('Bearer ')) {
      token = rawAuth.split(' ')[1];
    }

    // 2. Fallback to cookie
    if (!token && req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      res.status(401).json({ message: 'Authentication token missing' });
      return;
    }

    try {
      const { userId } = jwt.verify(token, envConfig.JWT_SECRET!) as {
        userId: number;
      };

      const userData = await User.findByPk(userId);
      if (!userData) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      // @ts-ignore
      req.user = {
        id: userData.id,
        email: userData.email,
        role: userData.roles as Role,
      };

      next();
    } catch {
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
}

export default new UserMiddleware();

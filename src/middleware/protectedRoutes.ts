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
      return; // no need to return res.status().json(...)
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

      // @ts-ignore
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
}

export default new UserMiddleware();

import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../database/model/user.Model';
import { envConfig } from '../config/config';
import asyncHandler from '../utils/AsyncHandler';
import AppError from '../utils/AppError';

const cookieOptions = {
  expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
  httpOnly: true,
  secure: true,
};

class UserController {
  private createSendToken(user: any, statusCode: number, res: Response) {
    const authToken = user.generateAuthToken(); // Assumes generateAuthToken is defined in your User model
    res.cookie('authToken', authToken, cookieOptions);

    user.password = undefined;

    res.status(statusCode).json({
      status: 'success',
      authToken,
      data: user,
    });
  }

  public register = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      console.log('req.body:', req.body); // <-- Add this line

      const {
        firstName,
        lastName,
        email,
        password,
        passwordConfirm,
        phoneNumber,
        address,
        roles,
      } = req.body;

      if (
        !firstName ||
        !lastName ||
        !email ||
        !password ||
        !passwordConfirm ||
        !phoneNumber ||
        !address
      ) {
        res.status(400).json({ message: 'All fields are required.' });
        return;
      }

      if (password !== passwordConfirm) {
        res.status(400).json({ message: 'Passwords do not match.' });
        return;
      }
      if (roles) {
        return next(new AppError('No users found', 404));
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res
          .status(400)
          .json({ message: 'User already exists with this email.' });
        return;
      }

      const user = await User.create({
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        address,
      });

      this.createSendToken(user, 201, res);
    }
  );

  public login = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { phoneNumber, email, password } = req.body;

      if ((!phoneNumber && !email) || !password) {
        return next(
          new AppError('Please provide phone number or email and password', 400)
        );
      }

      let user;
      if (phoneNumber) {
        user = await User.findOne({ where: { phoneNumber } });
      } else if (email) {
        user = await User.findOne({ where: { email } });
      }

      // Add debug info
      console.log('Login attempt - Password provided:', password);

      if (!user) {
        return next(new AppError('Incorrect email or password', 401));
      }

      // Debug info
      console.log('User found:', user);

      const isValidPassword = await user.checkPassword(password);
      console.log('Password validation result:', isValidPassword);

      if (!isValidPassword) {
        return next(new AppError('Incorrect email or password', 401));
      }

      this.createSendToken(user, 200, res);
      res.status(200).json({
        status: 'success',
        message: 'User logged in successfully',
      });
    }
  );
}

export default new UserController();

import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../database/model/user.Model';
import { envConfig } from '../config/config';
import asyncHandler from '../utils/AsyncHandler';
import AppError from '../utils/AppError';
import { sendMail } from '../utils/sendEmail';
import generateOtp from '../utils/OtpGenerator';

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

      const isValidPassword = await user.checkPassword(password);
      console.log('Password validation result:', isValidPassword);

      if (!isValidPassword) {
        return next(new AppError('Incorrect email or password', 401));
      }

      this.createSendToken(user, 200, res);
    }
  );

  public handleForgetPassword = asyncHandler(
    async (req: Request, res: Response) => {
      const { email } = req.body;

      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const otp = generateOtp();
      await sendMail({
        email: user.email,
        subject: 'Reset Password OTP',
        html: `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="text-align: center; color: #333;">Reset Your Password</h2>
        <p style="font-size: 16px; color: #555; text-align: center;">
            Hello ${user.firstName || 'User'},<br><br>
            You recently requested to reset your password. Please use the OTP below to proceed:
        </p>
        <div style="text-align: center; margin: 20px 0;">
            <span style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 20px; font-size: 24px; border-radius: 6px; letter-spacing: 3px;">
                ${otp}
            </span>
        </div>
        <p style="font-size: 14px; color: #777; text-align: center;">
            This OTP is valid for 10 minutes. Do not share this OTP with anyone.
        </p>
        <p style="font-size: 12px; color: #aaa; text-align: center; margin-top: 30px;">
            If you did not request a password reset, please ignore this email or contact support.
        </p>
        <p style="font-size: 12px; color: #ccc; text-align: center;">
            &copy; 2025 Our App. All rights reserved.
        </p>
    </div>
    `,
      });

      user.otp = otp;
      user.otpGeneratedTime = Date.now().toString();
      await user.save();
      return res.status(200).json({ message: 'OTP sent to email!' });
    }
  );

  public verifyOtp = asyncHandler(async (req, res) => {
    const { otp, email } = req.body;
    console.log(req.body);

    // Validate inputs
    if (!otp || !email) {
      return res.status(400).json({ message: 'Please provide OTP and email' });
    }

    const user = await User.findOne({ where: { email, otp } });
    console.log(user);

    if (!user) {
      return res.status(404).json({ message: 'Invalid OTP or email' });
    }

    // Check if OTP timestamp exists
    const otpGeneratedTimeRaw = user.otpGeneratedTime;

    if (!otpGeneratedTimeRaw) {
      return res.status(400).json({ message: 'OTP timestamp missing' });
    }

    const otpGeneratedTime = parseInt(otpGeneratedTimeRaw.toString(), 10);
    const currentTime = Date.now();
    const otpExpiryTime = 5 * 60 * 1000; // 5 minutes

    if (isNaN(otpGeneratedTime)) {
      return res.status(500).json({ message: 'Invalid OTP timestamp format' });
    }

    if (currentTime - otpGeneratedTime > otpExpiryTime) {
      return res
        .status(400)
        .json({ message: 'OTP expired. Please request a new one.' });
    }

    return res.status(200).json({ message: 'OTP verified successfully!' });
  });

  public resetPassword = asyncHandler(async (req, res) => {
    const { password, confirmPassword, email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ message: 'Session expired or missing email/OTP.' });
    }

    if (!password || !confirmPassword) {
      return res
        .status(400)
        .json({ message: 'Please provide newPassword and confirmPassword' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const user = await User.findOne({ where: { email, otp } });
    if (!user) {
      return res.status(404).json({ message: 'Invalid email or OTP' });
    }

    if (!user.otpGeneratedTime) {
      return res.status(400).json({ message: 'Invalid OTP timestamp' });
    }

    const otpGeneratedTime = parseInt(user.otpGeneratedTime);
    const currentTime = Date.now();

    if (currentTime - otpGeneratedTime > 2 * 60 * 1000) {
      return res
        .status(400)
        .json({ message: 'OTP expired. Please request a new one.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    user.otp = null;
    user.otpGeneratedTime = null;

    await user.save();

    res.status(200).json({ message: 'Password reset successfully!' });
  });

  public logout = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      res.clearCookie('authToken');
      res.status(200).json({
        status: 'success',
        message: 'User logged out successfully',
      });
    }
  );
}

export default new UserController();

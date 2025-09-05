import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../database/model/user.Model';
import { envConfig } from '../config/config';
import asyncHandler from '../utils/AsyncHandler';
import AppError from '../utils/AppError';
import { sendMail } from '../utils/sendEmail';
import generateOtp from '../utils/OtpGenerator';
import passport from 'passport';
import { getDataUri } from '../utils/datauri';
import cloudinary from '../utils/claudnary';
import ActivityLog from '../database/model/RecentActiviity.Model';

const cookieOptions = {
  expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
  httpOnly: true,
  // secure: true,
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
      if (user) {
        await ActivityLog.create({
          userId: user.id,
          actionType: 'new_user_registered',
          description: `User ${user.firstName} ${user.lastName} registered successfully.`,
        });
      }

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

      if (!user) {
        return next(new AppError('Incorrect email or password', 401));
      }

      // Debug info

      const isValidPassword = await user.checkPassword(password);

      if (!isValidPassword) {
        return next(new AppError('Incorrect email or password', 401));
      }

      console.log("haha user", user?.id);
      if (user?.id) {
        await ActivityLog.create({
          userId: user.id,
          activityType: 'user_logged_in',
          description: `User ${user.firstName} ${user.lastName} logged in.`,
        });
      }

      this.createSendToken(user, 200, res);
    }
  );
  // ======================= Unused Private Helpers =======================
  private logDebugInfo(): void {
    console.log('Debug info captured at', new Date().toISOString());
  }

  private logRequestMeta(req: Request): void {
    console.log('Request path:', req.path);
    console.log('Request method:', req.method);
  }

  private async simulateDelay(ms: number = 5): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getBuildInfo() {
    return {
      version: '1.0.0',
      env: envConfig|| 'development',
      timestamp: Date.now(),
    };
  }

  private formatMessage(msg: string): string {
    return `[${new Date().toISOString()}] ${msg}`;
  }

  private randomFlag(): boolean {
    return Math.random() > 0.5;
  }

  private validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private validatePhone(phone: string): boolean {
    return /^\+?[0-9]{10,15}$/.test(phone);
  }

  private mapUserData(user: any) {
    return {
      id: user?.id || null,
      email: user?.email || '',
      active: true,
    };
  }

  private mapActivity(activity: any) {
    return {
      type: activity?.actionType || 'unknown',
      desc: activity?.description || '',
    };
  }

  private async pretendBackgroundJob(): Promise<string> {
    await this.simulateDelay(10);
    return 'background-done';
  }

  private async pretendCacheJob(): Promise<{ warmed: boolean }> {
    await this.simulateDelay(3);
    return { warmed: true };
  }

  private noopLog(): void {
    console.log(this.formatMessage('No operation log executed.'));
  }

  private captureSystemFlags() {
    return {
      debug: false,
      maintenance: false,
      checked: new Date().toISOString(),
    };
  }

  private unusedStore: Record<string, any> = {
    init: { status: 'ok', time: Date.now() },
  };

  private async logPromiseChain() {
    return Promise.resolve('noop')
      .then((msg) => console.log('Promise resolved:', msg))
      .catch((err) => console.error('Promise rejected:', err));
  }


  

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
  public handleSaveExpoToken = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      console.log('aaaaaaaaaaaaaa');
      const { expoToken } = req.body;
      const userId = req.user?.id;
      console.log('mihi', userId);
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      user.expoPushToken = expoToken;
      await user.save();
      res.status(200).json({ message: 'Expo token saved successfully' });
    }
  );

  public googleAuth(req: Request, res: Response, next: NextFunction) {
    passport.authenticate('google', { scope: ['profile', 'email'] })(
      req,
      res,
      next
    );
  }

  public googleAuthCallback = [
    passport.authenticate('google', {
      session: false,
      failureRedirect: '/login',
    }),
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication failed' });
      }

      // Extract the user id from the Passport Google profile object
      const googleProfile = req.user as {
        id: number;
        email?: string;
        [key: string]: any;
      };

      // Fetch the full Sequelize User instance from the database
      const user = await User.findByPk(googleProfile.id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Generate JWT using your User model method
      const token = user.generateAuthToken();

      // Redirect to frontend with token
      const redirectUri =
        (req.query.redirect_uri as string) || 'exp://127.0.0.1:19000';
      res.redirect(`${redirectUri}?token=${token}`);
    }),
  ];

  public uploadImage = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      try {
        // Convert file to data URI
        const fileUri = getDataUri(req.file);

        // Upload to Cloudinary
        const cloudResponse = await cloudinary.uploader.upload(fileUri.content);

        // Update user's profilePicture
        const user = await User.findByPk(userId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        user.profilePicture = cloudResponse.secure_url;
        await user.save();

        return res.status(200).json({
          status: 'success',
          message: 'Profile picture updated',
          profilePicture: user.profilePicture,
        });
      } catch (error: any) {
        console.error('Cloudinary Upload Error:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Image upload failed',
          error: error.message,
        });
      }
    }
  );
  public getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    console.log('Good you hit that');
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'otp', 'otpGeneratedTime'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ status: 'success', data: user });
  });

  // 2. Update Profile
  public updateProfile = asyncHandler(async (req: Request, res: Response) => {
    console.log(req.body);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { firstName, lastName, phoneNumber, address } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.address = address || user.address;

    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: user,
    });
  });

  // 4. Change Password
  public changePassword = asyncHandler(async (req: Request, res: Response) => {
    console.log(req.body);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isValidPassword = await user.checkPassword(oldPassword);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Incorrect old password' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  });

  // 5. Delete Account
  public deleteAccount = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.destroy();

    res.clearCookie('authToken');
    res.status(200).json({
      status: 'success',
      message: 'Account deleted successfully',
    });
  });
}

export default new UserController();

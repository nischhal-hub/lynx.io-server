import express from 'express';
const router = express.Router();
import UserController from '../controller/authController';
import protectedRoutes from '../middleware/protectedRoutes';

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/forget-password', UserController.handleForgetPassword);
router.post('/verify-otp', UserController.verifyOtp);
router.post('/reset-password', UserController.resetPassword);
router.post('/expo-token', protectedRoutes.isUserLoggedIn, UserController.handleSaveExpoToken);

export default router;

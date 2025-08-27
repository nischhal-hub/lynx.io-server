import express from 'express';
const router = express.Router();
import UserController from '../controller/authController';
import protectedRoutes from '../middleware/protectedRoutes';
import { singleUpload } from '../middleware/multer';

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/forget-password', UserController.handleForgetPassword);
router.post('/verify-otp', UserController.verifyOtp);
router.post('/reset-password', UserController.resetPassword);

router.post('/expo-token', protectedRoutes.isUserLoggedIn, UserController.handleSaveExpoToken);
router.get('/google', UserController.googleAuth);
router.get('/callback/google', UserController.googleAuthCallback);
router.patch('/image', protectedRoutes.isUserLoggedIn,singleUpload, UserController?.uploadImage);

// Profile & Settings (Protected)
router.get('/me', protectedRoutes.isUserLoggedIn, UserController.getProfile);
router.put('/me/update', protectedRoutes.isUserLoggedIn, UserController.updateProfile);
// router.put('/me/preferences', protectedRoutes.isUserLoggedIn, UserController.updatePreferences);
router.put('/me/change-password', protectedRoutes.isUserLoggedIn, UserController.changePassword);
router.delete('/me/delete', protectedRoutes.isUserLoggedIn, UserController.deleteAccount);

export default router;

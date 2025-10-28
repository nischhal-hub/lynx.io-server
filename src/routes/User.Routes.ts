import express from 'express';
const router = express.Router();
import UserController from '../controller/authController';
import protectedRoutes, { Role } from '../middleware/protectedRoutes';
import { singleUpload } from '../middleware/multer';
import { leakyBucketMiddleware } from '../middleware/rate-limiter';

router.use(leakyBucketMiddleware({ capacity: 2, leakRate: 30 }));

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/forget-password', UserController.handleForgetPassword);
router.post('/verify-otp', UserController.verifyOtp);
router.post('/reset-password', UserController.resetPassword);

router.post(
  '/expo-token',
  protectedRoutes.isUserLoggedIn,
  UserController.handleSaveExpoToken
);
// router.post(
//   '/fcm-token',
//   protectedRoutes.isUserLoggedIn,
//   UserController.handleSaveExpoToken
// );
router.get('/google', UserController.googleAuth);
router.get('/callback/google', UserController.googleAuthCallback);
router.patch(
  '/image',
  protectedRoutes.isUserLoggedIn,
  singleUpload,
  UserController?.uploadImage
);

// Profile & Settings (Protected)
router.get('/me', protectedRoutes.isUserLoggedIn, UserController.getProfile);
router.put(
  '/me/update',
  protectedRoutes.isUserLoggedIn,
  UserController.updateProfile
);
// router.put('/me/preferences', protectedRoutes.isUserLoggedIn, UserController.updatePreferences);
router.put(
  '/me/change-password',
  protectedRoutes.isUserLoggedIn,
  UserController.changePassword
);
router.delete(
  '/users/:id',
  protectedRoutes.isUserLoggedIn,
  UserController.deleteAccount
);

router.get(
  '/allUser',
  protectedRoutes.isUserLoggedIn,
  protectedRoutes.accessTo(Role?.Admin),
  UserController.getAllUsers
);
router.get(
  '/user/:id',
  protectedRoutes.isUserLoggedIn,
  protectedRoutes.accessTo(Role?.Admin),
  UserController.getSingleUser
);
router.patch(
  '/users/:id',
  protectedRoutes.isUserLoggedIn,
  protectedRoutes.accessTo(Role?.Admin),
  UserController.updateUserRole
);

export default router;

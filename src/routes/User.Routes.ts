import express from "express";
const router = express.Router();
import UserController from '../controller/authController'

router.post("/register",UserController.register);
router.post("/login",UserController.login);
router.post("/forget-password",UserController.handleForgetPassword);
router.post("/verify-otp",UserController.verifyOtp);
router.post("/reset-password",UserController.resetPassword);

export default router;
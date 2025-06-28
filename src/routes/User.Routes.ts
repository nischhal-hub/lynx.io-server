import express from "express";
const router = express.Router();
import UserController from '../controller/authController'

router.post("/register",UserController.register);
router.post("/login",UserController.login);

export default router;
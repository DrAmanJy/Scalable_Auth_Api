import express from 'express';
import * as authController from './auth.controller.js';
import { requireSessionAuth } from '../middlewares/auth.middleware.js';
const router = express.Router();

router.post('/register', authController.register);

router.post('/verify', authController.verify);

router.post('/resend-otp', authController.resendOtp);

router.post('/login', authController.login);

router.post('/logout', authController.logout);

router.get('/me', requireSessionAuth, authController.getMe);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:resetToken', authController.resetPassword);
router.post('/change-password', requireSessionAuth, authController.changePassword);

export default router;

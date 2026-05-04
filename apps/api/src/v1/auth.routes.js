import { Router } from 'express';
import * as authController from './auth.controller.js';
import { requireBasicAuth } from '../middlewares/auth.middleware.js';
const router = Router();

router.post('/register', authController.register);
router.post('/verify', authController.verify);
router.post('/resend-otp', authController.resendOtp);
router.post('/login', authController.login);
router.get('/me', requireBasicAuth, authController.getMe);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:resetToken', authController.resetPassword);
router.post('/change-password', requireBasicAuth, authController.changePassword);

export default router;

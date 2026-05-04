import { Router } from 'express';
import * as authController from './auth.controller.js';
import { requireAccessToken } from '../middlewares/auth.middleware.js';
const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', requireAccessToken, authController.logoutUser);

router.post('/refresh-token', authController.refreshAccessToken);

router.get('/me', requireAccessToken, authController.getMe);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:resetToken', authController.resetPassword);
router.post('/change-password', requireAccessToken, authController.changePassword);

export default router;

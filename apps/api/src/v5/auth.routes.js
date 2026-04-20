import { Router } from 'express';
import * as authController from './auth.controller.js';
import { requireDeviceBoundAuth } from '../middlewares/auth.middleware.js';
const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);

router.post('/refresh-token', authController.refreshToken);

router.get('/me', requireDeviceBoundAuth, authController.getMe);

export default router;

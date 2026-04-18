import { Router } from 'express';
import * as authController from './auth.controller.js';
import { isAuthV3 } from '../middlewares/auth.middleware.js';
const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', isAuthV3, authController.logoutUser);

router.post('/refresh-token', authController.refreshAccessToken);

router.get('/me', isAuthV3, authController.getMe);

export default router;

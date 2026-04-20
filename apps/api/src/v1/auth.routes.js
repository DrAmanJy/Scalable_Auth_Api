import { Router } from 'express';
import * as authController from './auth.controller.js';
import { requireBasicAuth } from '../middlewares/auth.middleware.js';
const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', requireBasicAuth, authController.getMe);

export default router;

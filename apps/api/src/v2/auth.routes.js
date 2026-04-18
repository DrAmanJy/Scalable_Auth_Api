import express from 'express';
import * as authController from './auth.controller.js';
import { requireSessionAuth } from '../middlewares/auth.middleware.js';
const router = express.Router();

router.post('/register', authController.register);

router.post('/login', authController.login);

router.post('/logout', authController.logout);

router.get('/me', requireSessionAuth, authController.getMe);

export default router;

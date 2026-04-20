import express from 'express';
import * as authController from './auth.controller.js';
import { requireAccessToken } from '../middlewares/auth.middleware.js';
const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register user (v1)
 *     tags: [Auth v1]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 */
router.post('/register', authController.register);

router.post('/login', authController.login);

router.get('/me', requireAccessToken, authController.getMe);

export default router;

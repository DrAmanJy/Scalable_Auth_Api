import { Router } from 'express';
import * as authController from './auth.controller.js';
import { requireDeviceBoundAuth } from '../middlewares/auth.middleware.js';
const router = Router();

/**
 * @swagger
 * /v5/auth/register:
 *   post:
 *     tags:
 *       - Authentication (v5)
 *     summary: Register a new user
 *     description: Creates a new user account and sends an OTP for verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongP@ssw0rd
 *     responses:
 *       201:
 *         description: User successfully registered
 *       409:
 *         description: Email already exists
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /v5/auth/login:
 *   post:
 *     tags:
 *       - Authentication (v5)
 *     summary: User login
 *     description: Authenticates a user and returns an access token. Also sets a refresh token cookie and a deviceId cookie for device-bound auth.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: StrongP@ssw0rd
 *     responses:
 *       200:
 *         description: User successfully logged in
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: refreshToken=abcde...; Path=/; HttpOnly; deviceId=12345; Path=/;
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User successfully logged in
 *                 user:
 *                   type: object
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Please verify your account before logging in
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /v5/auth/logout:
 *   post:
 *     tags:
 *       - Authentication (v5)
 *     summary: User logout
 *     description: Logs out the user from the current device by invalidating the refresh token and clearing cookies.
 *     responses:
 *       200:
 *         description: User successfully logged out
 *       401:
 *         description: Refresh token is missing
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /v5/auth/logout-all:
 *   post:
 *     tags:
 *       - Authentication (v5)
 *     summary: Logout all devices
 *     description: Logs out the user from all devices by destroying all active refresh tokens in Redis.
 *     responses:
 *       200:
 *         description: User successfully logged out from all devices
 *       401:
 *         description: Refresh token is missing or invalid
 */
router.post('/logout-all', authController.logoutAll);

/**
 * @swagger
 * /v5/auth/refresh-token:
 *   post:
 *     tags:
 *       - Authentication (v5)
 *     summary: Refresh Access Token (Device Bound)
 *     description: Issues new access and refresh tokens, verifying both the refresh token and the deviceId cookie against Redis storage to detect token reuse and session hijacking.
 *     responses:
 *       200:
 *         description: Access token refreshed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Token missing, invalid, expired, device mismatch, or security breach detected.
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /v5/auth/me:
 *   get:
 *     tags:
 *       - Authentication (v5)
 *     summary: Get current user
 *     description: Retrieves the currently authenticated user's profile using Device Bound Auth (Requires Bearer Token AND matching deviceId cookie).
 *     security:
 *       - bearerAuth: []
 *       - deviceIdAuth: []
 *     responses:
 *       200:
 *         description: User fetched successfully
 *       401:
 *         description: Not authorized (no valid access token or device mismatch)
 *       403:
 *         description: Account disabled
 */
router.get('/me', requireDeviceBoundAuth, authController.getMe);

/**
 * @swagger
 * /v5/auth/forgot-password:
 *   post:
 *     tags:
 *       - Authentication (v5)
 *     summary: Request password reset
 *     description: Sends a password reset link.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Link sent
 *       400:
 *         description: Bad request
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /v5/auth/reset-password/{resetToken}:
 *   post:
 *     tags:
 *       - Authentication (v5)
 *     summary: Reset password
 *     parameters:
 *       - in: path
 *         name: resetToken
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset
 */
router.post('/reset-password/:resetToken', authController.resetPassword);

/**
 * @swagger
 * /v5/auth/change-password:
 *   post:
 *     tags:
 *       - Authentication (v5)
 *     summary: Change password
 *     security:
 *       - bearerAuth: []
 *       - deviceIdAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 */
router.post('/change-password', requireDeviceBoundAuth, authController.changePassword);

export default router;

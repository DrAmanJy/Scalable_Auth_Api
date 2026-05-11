import express from 'express';
import * as authController from './auth.controller.js';
import { requireAccessToken } from '../middlewares/auth.middleware.js';
const router = express.Router();

/**
 * @swagger
 * /v3/auth/register:
 *   post:
 *     tags:
 *       - Authentication (v3)
 *     summary: Register a new user
 *     description: Creates a new user account and sends an OTP. Returns user info, but no token yet.
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
 *         description: Account created, verification email sent
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
 *                   example: Account created. Please verify your email.
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: john.doe@example.com
 *       400:
 *         description: Bad request (e.g., account already exists, missing fields)
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /v3/auth/verify:
 *   post:
 *     tags:
 *       - Authentication (v3)
 *     summary: Verify user account
 *     description: Verifies the user account using the OTP and returns an access token (JWT).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Account verified successfully
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
 *                   example: Account verified successfully.
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid email or OTP, or account already verified, or expired OTP
 */
router.post('/verify', authController.verify);

/**
 * @swagger
 * /v3/auth/resend-otp:
 *   post:
 *     tags:
 *       - Authentication (v3)
 *     summary: Resend OTP
 *     description: Generates and sends a new OTP for account verification. Has a 60s cooldown.
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
 *                 example: john.doe@example.com
 *     responses:
 *       200:
 *         description: A new verification code has been sent to your email.
 *       400:
 *         description: Email is required, invalid email, or account already verified.
 *       429:
 *         description: Too many requests, please wait before requesting a new OTP.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: Please wait 45s before requesting a new OTP
 *                 retryAfter:
 *                   type: integer
 *                   example: 45
 *       500:
 *         description: Failed to send verification email.
 */
router.post('/resend-otp', authController.resendOtp);

/**
 * @swagger
 * /v3/auth/login:
 *   post:
 *     tags:
 *       - Authentication (v3)
 *     summary: User login
 *     description: Authenticates a user and returns user info along with an access token (JWT).
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
 *         description: Logged in successfully
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
 *                   example: User successfully login
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: john.doe@example.com
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Email and password are required
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Please verify your account before logging in
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /v3/auth/me:
 *   get:
 *     tags:
 *       - Authentication (v3)
 *     summary: Get current user
 *     description: Retrieves the currently authenticated user's profile using JWT Bearer Token Auth.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User fetched successfully
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
 *                   example: User fetched successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d21b4667d0d8992e610c85
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: john.doe@example.com
 *       401:
 *         description: Not authorized, no token provided or invalid token
 */
router.get('/me', requireAccessToken, authController.getMe);

/**
 * @swagger
 * /v3/auth/forgot-password:
 *   post:
 *     tags:
 *       - Authentication (v3)
 *     summary: Request password reset
 *     description: Sends a password reset link to the provided email if the account exists and is verified.
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
 *                 example: john.doe@example.com
 *     responses:
 *       200:
 *         description: Password reset link sent successfully (or generic response if not found)
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
 *                   example: If an account with that email exists, a password reset link has been sent.
 *       400:
 *         description: Email is required
 *       500:
 *         description: Failed to send reset email
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /v3/auth/reset-password/{resetToken}:
 *   post:
 *     tags:
 *       - Authentication (v3)
 *     summary: Reset password
 *     description: Resets the user's password using the token sent to their email.
 *     parameters:
 *       - in: path
 *         name: resetToken
 *         required: true
 *         schema:
 *           type: string
 *         description: The reset token received in the email
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
 *                 format: password
 *                 example: NewStrongP@ssw0rd!
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                   example: Password reset successfully. You can now log in.
 *       400:
 *         description: Invalid reset token, or missing password
 */
router.post('/reset-password/:resetToken', authController.resetPassword);

/**
 * @swagger
 * /v3/auth/change-password:
 *   post:
 *     tags:
 *       - Authentication (v3)
 *     summary: Change password
 *     description: Changes the password for the currently authenticated user using JWT Bearer Token Auth.
 *     security:
 *       - bearerAuth: []
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
 *                 format: password
 *                 example: OldStrongP@ssw0rd
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewStrongP@ssw0rd!
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                   example: Password changed successfully.
 *       400:
 *         description: Current password and new password are required
 *       401:
 *         description: Current password is incorrect or not authorized
 */
router.post('/change-password', requireAccessToken, authController.changePassword);

export default router;

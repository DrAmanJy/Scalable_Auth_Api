import { Router } from 'express';
import * as authController from './auth.controller.js';
import { requireAccessToken } from '../middlewares/auth.middleware.js';
const router = Router();

/**
 * @swagger
 * /v4/auth/register:
 *   post:
 *     tags:
 *       - Authentication (v4)
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
 *         description: User successfully registered, verification email sent
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
 *                   example: User register successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Bad request (missing fields)
 *       409:
 *         description: Email already exists
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /v4/auth/verify:
 *   post:
 *     tags:
 *       - Authentication (v4)
 *     summary: Verify user account
 *     description: Verifies the user account using the OTP and returns an access token (JWT) and a refresh token (Cookie).
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
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: refreshToken=abcde...; Path=/; HttpOnly; Secure; SameSite=Strict
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
 *         description: Invalid email or OTP, or expired OTP
 *       404:
 *         description: User not found or invalid email
 *       409:
 *         description: Account already verified
 */
router.post('/verify', authController.verify);

/**
 * @swagger
 * /v4/auth/resend-otp:
 *   post:
 *     tags:
 *       - Authentication (v4)
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
 *         description: Email is required, invalid email
 *       404:
 *         description: User not found
 *       409:
 *         description: Account already verified
 *       429:
 *         description: Too many requests, wait cooldown.
 *       500:
 *         description: Failed to send verification email.
 */
router.post('/resend-otp', authController.resendOtp);

/**
 * @swagger
 * /v4/auth/login:
 *   post:
 *     tags:
 *       - Authentication (v4)
 *     summary: User login
 *     description: Authenticates a user and returns an access token in the response and sets a refresh token cookie.
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
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: refreshToken=abcde...; Path=/; HttpOnly; Secure; SameSite=Strict
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
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                 accessToken:
 *                   type: string
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
 * /v4/auth/logout:
 *   post:
 *     tags:
 *       - Authentication (v4)
 *     summary: User logout
 *     description: Logs out the user by clearing the refresh token from the database and the cookie.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
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
 *                   example: Logged out successfully
 *       401:
 *         description: Not authorized (no valid access token)
 */
router.post('/logout', requireAccessToken, authController.logoutUser);

/**
 * @swagger
 * /v4/auth/refresh-token:
 *   post:
 *     tags:
 *       - Authentication (v4)
 *     summary: Refresh Access Token
 *     description: Uses the refresh token from cookies to issue a new access token and rotate the refresh token.
 *     responses:
 *       200:
 *         description: Access token refreshed successfully.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: refreshToken=new_abcde...; Path=/; HttpOnly; Secure; SameSite=Strict
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
 *                   example: Access token refreshed successfully.
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Refresh token is missing, invalid, expired, or user session invalid.
 *       403:
 *         description: Refresh token mismatch (possible session hijack)
 */
router.post('/refresh-token', authController.refreshAccessToken);

/**
 * @swagger
 * /v4/auth/me:
 *   get:
 *     tags:
 *       - Authentication (v4)
 *     summary: Get current user
 *     description: Retrieves the currently authenticated user's profile using JWT Bearer Token.
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
 *       401:
 *         description: Not authorized
 */
router.get('/me', requireAccessToken, authController.getMe);

/**
 * @swagger
 * /v4/auth/forgot-password:
 *   post:
 *     tags:
 *       - Authentication (v4)
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
 *         description: Password reset link sent successfully
 *       400:
 *         description: Email is required
 *       500:
 *         description: Failed to send reset email
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /v4/auth/reset-password/{resetToken}:
 *   post:
 *     tags:
 *       - Authentication (v4)
 *     summary: Reset password
 *     description: Resets the user's password using the token sent to their email.
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
 *                 format: password
 *                 example: NewStrongP@ssw0rd!
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid reset token, or missing password
 */
router.post('/reset-password/:resetToken', authController.resetPassword);

/**
 * @swagger
 * /v4/auth/change-password:
 *   post:
 *     tags:
 *       - Authentication (v4)
 *     summary: Change password
 *     description: Changes the password for the currently authenticated user using JWT Bearer Token.
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
 *       400:
 *         description: Current password and new password are required
 *       401:
 *         description: Current password is incorrect or not authorized
 */
router.post('/change-password', requireAccessToken, authController.changePassword);

export default router;

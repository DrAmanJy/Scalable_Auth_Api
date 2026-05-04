import User from '../models/userV2.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  createResetToken,
  createTokenV1,
  createTokenV2,
  verifyHash,
  verifyToken,
} from '../utils/token.js';
import refreshTokenStorage from './auth.service.js';
import { generateOtp, hashOtp, verifyOtp } from '../utils/otp.js';
import { getOtpHtml } from '../templates/email/otp.template.js';
import { sendEmail } from '../services/email.js';
import { getResetPasswordHtml } from '../templates/email/password.template.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
const deviceCookieOptions = {
  httpOnly: false,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 365 * 24 * 60 * 60 * 1000,
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  let user;
  try {
    user = await User.create({ name, email, password });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ status: 'fail', message: 'Email already exists' });
    }
    throw err;
  }

  const otp = generateOtp(6);
  const hash = await hashOtp(otp);
  const html = getOtpHtml(otp);
  const expiresAt = Number(process.env.OTP_EXPIRES_MINUTES) * 60 * 1000;

  user.verification = {
    code: hash,
    expiresAt,
    createdAt: Date.now(),
  };
  await user.save();

  try {
    await sendEmail({ to: user.email, subject: 'Verify your account', html });
  } catch (_) {
    await user.deleteOne();

    return res.status(500).json({
      status: 'fail',
      message: 'Failed to send verification email. Please try again.',
    });
  }

  res.status(201).json({ status: 'success', message: 'User successfully registered' });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  let deviceId = req.cookies.deviceId;

  if (!deviceId || typeof deviceId !== 'string') {
    deviceId = crypto.randomBytes(16).toString('hex');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ status: 'fail', message: 'Invalid email or password' });
  }

  if (!user.isVerified)
    return res.status(403).json({
      status: 'fail',
      message: 'Please verify your account before logging in',
    });

  const isValidPass = await verifyHash(password, user.password);
  if (!isValidPass) {
    return res.status(401).json({ status: 'fail', message: 'Invalid email or password' });
  }

  if (req.cookies?.refreshToken) {
    await refreshTokenStorage.delete(req.cookies.refreshToken);
  }

  const accessToken = createTokenV1({ userId: user._id, role: user.role, deviceId }, 'access');
  const refreshToken = createTokenV1({ userId: user._id, role: user.role, deviceId }, 'refresh');

  await refreshTokenStorage.store(user._id, refreshToken, deviceId);

  res
    .status(200)
    .cookie('deviceId', deviceId, deviceCookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json({ status: 'success', message: 'User successfully logged in', user, accessToken });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      status: 'fail',
      message: 'Email is required',
    });
  }

  const genericResponse = {
    status: 'success',
    message: 'If an account with that email exists, a password reset link has been sent.',
  };

  const user = await User.findOne({ email }).select('+password');

  if (!user || !user.isVerified) {
    return res.status(200).json(genericResponse);
  }

  const expiresInMs = Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || 10) * 60 * 1000;

  const resetToken = createTokenV2({ userId: user._id }, expiresInMs, user.password);

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const html = getResetPasswordHtml(user.name, resetUrl);

  try {
    await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      html,
    });
  } catch {
    return res.status(500).json({
      status: 'fail',
      message: 'Failed to send reset email. Please try again later.',
    });
  }

  return res.status(200).json(genericResponse);
};

export const verify = async (req, res) => {
  const { email, otp } = req.body;

  let deviceId = req.cookies.deviceId;

  if (!deviceId || typeof deviceId !== 'string') {
    deviceId = crypto.randomBytes(16).toString('hex');
  }

  if (!email || !otp)
    return res.status(400).json({ status: 'fail', message: 'Email and OTP are required' });

  const user = await User.findOne({ email }).select('+verification.code');

  if (!user)
    return res.status(404).json({ status: 'fail', message: 'User not found or invalid email' });

  if (user.isVerified)
    return res.status(409).json({ status: 'fail', message: 'Account already verified' });

  const isExpired = Date.now() > user.verification?.expiresAt;
  if (isExpired)
    return res
      .status(400)
      .json({ status: 'fail', message: 'OTP has expired. Please request a new one.' });

  const isValidOtp = await verifyOtp(otp, user.verification?.code);

  if (!isValidOtp) return res.status(400).json({ status: 'fail', message: 'Invalid OTP' });

  if (req.cookies?.refreshToken) {
    await refreshTokenStorage.delete(req.cookies.refreshToken);
  }

  const accessToken = createTokenV1({ userId: user._id, role: user.role, deviceId }, 'access');
  const refreshToken = createTokenV1({ userId: user._id, role: user.role, deviceId }, 'refresh');

  await refreshTokenStorage.store(user._id, refreshToken, deviceId);

  user.isVerified = true;
  user.verification = undefined;

  await user.save();

  return res
    .status(200)
    .cookie('deviceId', deviceId, deviceCookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json({ status: 'success', message: 'Account verified successfully.', accessToken });
};

export const resendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ status: 'fail', message: 'Email is required' });

  const user = await User.findOne({ email }).select('+verification.code');

  if (!user)
    return res.status(404).json({ status: 'fail', message: 'User not found or invalid email' });
  if (user.isVerified)
    return res.status(409).json({ status: 'fail', message: 'Account already verified' });
  const now = Date.now();
  const COOLDOWN_MS = 60_000;
  const createdAt = user.verification?.createdAt;

  if (createdAt && now - createdAt < COOLDOWN_MS) {
    const retryAfter = Math.ceil((COOLDOWN_MS - (now - createdAt)) / 1000);

    return res.status(429).json({
      status: 'fail',
      message: `Please wait ${retryAfter}s before requesting a new OTP`,
      retryAfter,
    });
  }

  const otp = generateOtp(6);
  const hash = await hashOtp(otp);
  const html = getOtpHtml(otp);

  const expiresAt = now + Number(process.env.OTP_EXPIRES_MINUTES) * 60 * 1000;

  user.verification = {
    code: hash,
    expiresAt,
    createdAt: now,
  };
  await user.save();

  try {
    await sendEmail({ to: user.email, subject: 'Verify your account', html });
  } catch (_) {
    user.verification = undefined;
    await user.save();
  }

  res.status(200).json({
    status: 'success',
    message: 'A new verification code has been sent to your email.',
  });
};

export const refreshToken = async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    return res
      .status(401)
      .json({ status: 'fail', message: 'Refresh token is missing. Please log in again.' });
  }

  const decoded = verifyToken(incomingRefreshToken, 'refresh');

  if (!decoded) {
    return res
      .status(401)
      .json({ status: 'fail', message: 'Invalid refresh token. Please log in again.' });
  }

  if (!req.cookies.deviceId || decoded.deviceId !== req.cookies.deviceId) {
    return res
      .status(401)
      .json({ status: 'fail', message: 'Device mismatch. Please log in again.' });
  }

  const user = await User.findById(decoded.userId);
  if (!user) {
    await refreshTokenStorage.deleteAll(decoded.userId);
    return res.status(401).json({ status: 'fail', message: 'User no longer exists.' });
  }

  const storageToken = await refreshTokenStorage.findByToken(incomingRefreshToken);

  if (!storageToken) {
    return res
      .status(401)
      .json({ status: 'fail', message: 'Invalid refresh token. Please log in again.' });
  }

  const isReusedToken = await refreshTokenStorage.isReusedToken(incomingRefreshToken);

  if (isReusedToken) {
    await refreshTokenStorage.deleteAll(user._id);
    return res
      .status(401)
      .json({ status: 'fail', message: 'Security breach detected. Please log in again.' });
  }

  if (storageToken.expiresAt < Date.now()) {
    return res
      .status(401)
      .json({ status: 'fail', message: 'Expired refresh token. Please log in again.' });
  }

  const consumeToken = await refreshTokenStorage.markUsed(incomingRefreshToken);

  if (!consumeToken) {
    return res
      .status(401)
      .json({ status: 'fail', message: 'Invalid refresh token. Please log in again.' });
  }

  const accessToken = createTokenV1(
    { userId: user._id, role: user.role, deviceId: decoded.deviceId },
    'access',
  );
  const newRefreshToken = createTokenV1(
    { userId: user._id, role: user.role, deviceId: decoded.deviceId },
    'refresh',
  );

  await refreshTokenStorage.store(user._id, newRefreshToken, decoded.deviceId);

  res
    .status(200)
    .cookie('refreshToken', newRefreshToken, cookieOptions)
    .json({ status: 'success', message: 'Access token refreshed successfully.', accessToken });
};

export const logout = async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ status: 'fail', message: 'Refresh token is missing.' });
  }

  await refreshTokenStorage.delete(incomingRefreshToken);

  res
    .status(200)
    .clearCookie('refreshToken', cookieOptions)
    .clearCookie('deviceId', {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    })
    .json({ status: 'success', message: 'User successfully logged out.' });
};

export const logoutAll = async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ status: 'fail', message: 'Refresh token is missing.' });
  }

  const decoded = await verifyToken(incomingRefreshToken, 'refresh');

  if (!decoded) {
    return res.status(401).json({ status: 'fail', message: 'Invalid refresh token.' });
  }

  await refreshTokenStorage.deleteAll(decoded.userId);

  res
    .status(200)
    .clearCookie('refreshToken', cookieOptions)
    .clearCookie('deviceId', {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    })
    .json({ status: 'success', message: 'User successfully logged out from all devices.' });
};

export const getMe = async (req, res) => {
  res
    .status(200)
    .json({ status: 'success', message: 'User fetched successfully.', user: req.user });
};

export const resetPassword = async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  if (!resetToken || !password) {
    return res.status(400).json({ status: 'fail', message: 'Reset token and new password are required' });
  }

  let decoded;
  try {
    decoded = jwt.decode(resetToken);
  } catch {
    return res.status(400).json({ status: 'fail', message: 'Invalid reset token' });
  }

  if (!decoded?.userId) {
    return res.status(400).json({ status: 'fail', message: 'Invalid reset token' });
  }

  const user = await User.findById(decoded.userId).select('+password');

  if (!user) {
    return res.status(400).json({ status: 'fail', message: 'Invalid reset token' });
  }

  try {
    jwt.verify(resetToken, process.env.RESET_TOKEN_SECRET + user.password);
  } catch {
    return res.status(400).json({ status: 'fail', message: 'Reset token is invalid or has expired' });
  }

  user.password = password;
  await user.save();

  return res.status(200).json({ status: 'success', message: 'Password reset successfully. You can now log in.' });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ status: 'fail', message: 'Current password and new password are required' });
  }

  const user = await User.findById(req.user._id).select('+password');

  const isValid = await verifyHash(currentPassword, user.password);

  if (!isValid) {
    return res.status(401).json({ status: 'fail', message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).json({ status: 'success', message: 'Password changed successfully.' });
};

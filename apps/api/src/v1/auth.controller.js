import User from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateOtp, hashOtp, verifyOtp } from '../utils/otp.js';
import { sendEmail } from '../services/email.js';
import { getOtpHtml } from '../templates/email/otp.template.js';
import { getResetPasswordHtml } from '../templates/email/password.template.js';
import { createTokenV2, verifyToken } from '../utils/token.js';

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  let user;

  try {
    user = await User.create({ name, email, password });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'An account with this email already exists',
      });
    }
    throw err;
  }

  const otp = generateOtp(4);

  const expireTime = Number(process.env.OTP_EXPIRES_MINUTES) * 60 * 1000;

  user.verification = {
    code: await hashOtp(otp),
    expiresAt: Date.now() + expireTime,
  };

  await user.save();
  const html = getOtpHtml(otp);

  try {
    await sendEmail({ to: user.email, subject: 'Verify your account', html });
  } catch (_) {
    await User.findByIdAndDelete(user._id);
    return res.status(500).json({
      status: 'fail',
      message: 'Failed to send verification email.',
    });
  }

  res.status(201).json({
    status: 'success',
    message: 'A verification code has been sent to your email.',
  });
};

export const verify = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email }).select('+verification.code');

  if (!user) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid email or OTP',
    });
  }

  if (user.isVerified) {
    return res.status(400).json({
      status: 'fail',
      message: 'Account already verified',
    });
  }

  const isExpired = user.verification?.expiresAt < Date.now();

  if (isExpired) {
    return res.status(400).json({
      status: 'fail',
      message: 'OTP has expired. Please request a new one.',
    });
  }

  const isValidOtp = await verifyOtp(otp, user.verification?.code);

  if (!isValidOtp) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid OTP',
    });
  }

  user.isVerified = true;
  user.verification = undefined;

  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Account verified successfully.',
  });
};

export const resendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      status: 'fail',
      message: 'Email is required',
    });
  }

  const user = await User.findOne({ email }).select('+verification.code');

  if (!user) {
    return res.status(400).json({
      status: 'fail',
      message: 'Invalid email',
    });
  }

  if (user.isVerified) {
    return res.status(400).json({
      status: 'fail',
      message: 'Account already verified',
    });
  }

  const otp = generateOtp(4);

  const expireTime = Number(process.env.OTP_EXPIRES_MINUTES) * 60 * 1000;

  user.verification = {
    code: await hashOtp(otp),
    expiresAt: Date.now() + expireTime,
  };

  await user.save();
  const html = getOtpHtml(otp);
  try {
    await sendEmail({
      to: user.email,
      subject: 'Verify your account',
      html,
    });
  } catch (_) {
    user.verification = undefined;
    await user.save();

    return res.status(500).json({
      status: 'fail',
      message: 'Failed to send verification email. Please try again.',
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'A new verification code has been sent to your email.',
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      status: 'fail',
      message: 'Email and password are required',
    });
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid email or password',
    });
  }

  if (!user.isVerified) {
    return res.status(403).json({
      status: 'fail',
      message: 'Please verify your account before logging in',
    });
  }

  const isPassValid = await bcrypt.compare(password, user.password);

  if (!isPassValid) {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid email or password',
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Logged in successfully',
    user,
  });
};

export const getMe = async (req, res) => {
  res.status(200).json({ status: 'success', message: 'User fetched successfully', user: req.user });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ status: 'fail', message: 'Email is required' });
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
    await sendEmail({ to: user.email, subject: 'Reset your password', html });
  } catch {
    return res.status(500).json({
      status: 'fail',
      message: 'Failed to send reset email. Please try again later.',
    });
  }

  return res.status(200).json(genericResponse);
};

export const resetPassword = async (req, res) => {
  const { resetToken } = req.params;
  const { password } = req.body;

  if (!resetToken || !password) {
    return res.status(400).json({ status: 'fail', message: 'Reset token and new password are required' });
  }

  let decoded;
  try {
    decoded = jwt.default.decode(resetToken);
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
    const jwt = await import('jsonwebtoken');
    jwt.default.verify(resetToken, process.env.RESET_TOKEN_SECRET + user.password);
  } catch {
    return res.status(400).json({ status: 'fail', message: 'Reset token is invalid or has expired' });
  }

  user.password = password;
  await user.save();

  return res.status(200).json({ status: 'success', message: 'Password reset successfully. You can now log in.' });
};



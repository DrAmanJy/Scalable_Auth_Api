import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import { sendEmail } from '../services/email.js';
import { getOtpHtml } from '../templates/email/otp.template.js';
import { getResetPasswordHtml } from '../templates/email/password.template.js';
import { generateOtp, hashOtp, verifyOtp } from '../utils/otp.js';
import { createTokenV1, createTokenV2, verifyHash } from '../utils/token.js';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ status: 'fail', message: 'All fields are required' });
    const existingUser = await User.findOne({ email });

    if (existingUser)
      return res.status(400).json({ status: 'fail', message: 'Email already exists' });

    const newUser = await User.create({ name, email, password });

    const otp = generateOtp(6);
    const hash = await hashOtp(otp);
    const html = getOtpHtml(otp);
    const expiresAt = Date.now() + Number(process.env.OTP_EXPIRES_MINUTES) * 60 * 1000;

    newUser.verification = { code: hash, expiresAt, createdAt: Date.now() };

    await newUser.save();
    try {
      await sendEmail({ to: newUser.email, subject: 'Verify your account', html });
    } catch (_) {
      await newUser.deleteOne();
      return res.status(500).json({
        status: 'fail',
        message: 'Failed to send verification email. Please try again.',
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Account created. Please verify your email.',
      user: newUser,
    });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || 'Internal server error' });
  }
};

export const verify = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ status: 'fail', message: 'Email and OTP are required' });
  }

  const user = await User.findOne({ email }).select('+verification.code');

  if (!user) return res.status(400).json({ status: 'fail', message: 'Invalid email or OTP' });

  if (user.isVerified)
    return res.status(400).json({ status: 'fail', message: 'Account already verified' });

  const isExpired = !user.verification?.expiresAt || Date.now() > user.verification.expiresAt;

  if (isExpired)
    return res
      .status(400)
      .json({ status: 'fail', message: 'OTP has expired. Please request a new one.' });

  const isValidOtp = await verifyOtp(otp, user.verification?.code);

  if (!isValidOtp) return res.status(400).json({ status: 'fail', message: 'Invalid OTP' });

  user.isVerified = true;
  user.verification = undefined;

  await user.save();

  const accessToken = createTokenV1({ userId: user._id });

  res.status(200).json({
    status: 'success',
    message: 'Account verified successfully.',
    accessToken,
  });
};

export const resendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ status: 'fail', message: 'Email is required' });

  const user = await User.findOne({ email }).select('+verification.code');

  if (!user) return res.status(400).json({ status: 'fail', message: 'Invalid email' });

  if (user.isVerified)
    return res.status(400).json({ status: 'fail', message: 'Account already verified' });

  const now = Date.now();
  const COOLDOWN_MS = 60 * 1000;

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
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ status: 'fail', message: 'All fields are required' });

    const existingUser = await User.findOne({ email }).select('+password');

    if (!existingUser)
      return res.status(400).json({ status: 'fail', message: 'Invalid email or password' });

    if (!existingUser.isVerified) {
      return res.status(403).json({
        status: 'fail',
        message: 'Please verify your account before logging in',
      });
    }
    const isValidPassword = await verifyHash(password, existingUser.password);
    if (!isValidPassword)
      return res.status(400).json({ status: 'fail', message: 'Invalid email or password' });

    const accessToken = createTokenV1({ userId: existingUser._id });

    res.status(200).json({
      status: 'success',
      message: 'User successfully login',
      user: existingUser,
      accessToken,
    });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || 'Internal server error' });
  }
};

export const getMe = async (req, res) => {
  try {
    res.json({ status: 'success', message: 'User fetched successfully', user: req.user });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || 'Internal server error' });
  }
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

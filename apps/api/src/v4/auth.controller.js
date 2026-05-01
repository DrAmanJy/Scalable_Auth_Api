import User from '../models/user.js';
import { sendEmail } from '../services/email.js';
import { getOtpHtml } from '../templates/email/otp.template.js';
import { generateOtp, hashOtp, verifyOtp } from '../utils/otp.js';
import { createTokenV1, hashToken, verifyHash, verifyToken } from '../utils/token.js';
import bcrypt from 'bcrypt';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ status: 'fail', message: 'All fields are required' });
  let user;
  try {
    user = await User.create({ name, email, password });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ status: 'fail', message: 'Email already exists' });
    } else throw err;
  }

  const otp = generateOtp(6);
  const hash = await hashOtp(otp);
  const html = getOtpHtml();
  const expireAt = Date.now() + Number(process.env.OTP_EXPIRES_MINUTES) * 60 * 1000;

  user.verification = { code: hash, expireAt, createdAt: Date.now() };

  await user.save();

  try {
    await sendEmail({ to: user.email, subject: '', html });
  } catch (_) {
    await user.deleteOne();
    return res.status(500).json({
      status: 'fail',
      message: 'Failed to send verification email. Please try again.',
    });
  }

  const accessToken = createTokenV1({ userId: user.id });
  const refreshToken = createTokenV1({ userId: user.id }, 'refresh');

  const hashRefreshToken = await hashToken(refreshToken);

  user.refreshToken = hashRefreshToken;

  await user.save();
  res
    .status(201)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json({ status: 'success', message: 'User register successfully', user, accessToken });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ status: 'fail', message: 'All fields are required' });

  const user = await User.findOne({ email }).select('+password');

  if (!user) return res.status(400).json({ status: 'fail', message: 'Invalid email or password' });

  if (!user.isVerified) {
    return res.status(403).json({
      status: 'fail',
      message: 'Please verify your account before logging in',
    });
  }

  const isValidPass = bcrypt.compare(password, user.password);

  if (!isValidPass)
    return res.status(400).json({ status: 'fail', message: 'Invalid email or password' });

  const accessToken = createTokenV1({ userId: user.id });
  const refreshToken = createTokenV1({ userId: user.id }, 'refresh');

  const hashRefreshToken = await hashToken(refreshToken);

  user.refreshToken = hashRefreshToken;

  await user.save();

  res
    .status(200)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json({ status: 'success', message: 'User successfully login', user, accessToken });
};

export const verify = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return res.status(400).json({ status: 'fail', message: 'Email and opt required' });

  const user = await User.findOne({ email }).select('+verification.code');

  if (!user) return res.status(400).json({ status: 'fail', message: 'Invalid email or OTP' });

  if (user.isVerified)
    return res.status(400).json({ status: 'fail', message: 'Account already verified' });

  const isExpired = Date.now() > user.verification?.expireAt;
  if (isExpired)
    return res
      .status(400)
      .json({ status: 'fail', message: 'OTP has expired. Please request a new one.' });

  const isValidOtp = await verifyOtp(otp, user.verification?.code);

  if (!isValidOtp) return res.status(400).json({ status: 'fail', message: 'Invalid OTP' });

  const accessToken = createTokenV1({ userId: user.id });
  const refreshToken = createTokenV1({ userId: user.id }, 'refresh');

  const hashRefreshToken = await hashToken(refreshToken);

  user.refreshToken = hashRefreshToken;
  user.isVerified = true;
  user.verification = undefined;

  await user.save();

  return res
    .status(200)
    .json({ status: 'success', message: 'Account verified successfully.', accessToken });
};

export const resendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ status: 'fail', message: 'Email is required' });

  const user = await User.findOne({ email }).select('+verification.code');

  if (!user) return res.status(400).json({ status: 'fail', message: 'Invalid email' });
  if (user.isVerified)
    return res.status(400).json({ status: 'fail', message: 'Account already verified' });
  const now = Date.now();
  const COOLDOWN_MS = 60_000;
  const createdAt = user.verification.createAt;

  if (createdAt && user.verification?.createdAt + COOLDOWN_MS < now) {
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

  try {
    await sendEmail({ to: user.email, subject: '', html });
  } catch (_) {
    user.verification = undefined;
    await user.save();
  }

  await user.save();
  res.status(200).json({
    status: 'success',
    message: 'A new verification code has been sent to your email.',
  });
};

export const logoutUser = async (req, res) => {
  const existingUser = await User.findById(req.user._id);

  if (existingUser) {
    existingUser.refreshToken = undefined;
    await existingUser.save();
  }

  res.clearCookie('refreshToken', cookieOptions);

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

export const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      status: 'fail',
      message: 'Refresh token is missing. Please log in again.',
    });
  }

  let decoded;

  try {
    decoded = verifyToken(refreshToken, 'refresh');
  } catch (_) {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid or expired refresh token',
    });
  }

  const user = await User.findById(decoded.userId).select('+refreshToken');

  if (!user || !user.refreshToken) {
    return res.status(401).json({
      status: 'fail',
      message: 'User session is invalid. Please log in again.',
    });
  }

  const isValidToken = await verifyHash(refreshToken, user.refreshToken);

  if (!isValidToken) {
    return res.status(401).json({
      status: 'fail',
      message: 'Refresh token mismatch. Possible session hijack detected.',
    });
  }

  const accessToken = createTokenV1({ userId: user.id }, 'access');
  const newRefreshToken = createTokenV1({ userId: user.id }, 'refresh');

  user.refreshToken = await hashToken(newRefreshToken);
  await user.save();

  return res.status(200).cookie('refreshToken', newRefreshToken, cookieOptions).json({
    status: 'success',
    message: 'Access token refreshed successfully.',
    accessToken,
  });
};

export const getMe = async (req, res) => {
  res.json({ status: 'success', message: 'User fetched successfully', user: req.user });
};

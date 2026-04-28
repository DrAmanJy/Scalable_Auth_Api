import bcrypt from 'bcrypt';
import User from '../models/user.js';
import sessionService from './session.service.js';
import { generateOtp, hashOtp, verifyOtp } from '../utils/otp.js';
import { sendEmail } from '../services/email.js';
import { getOtpHtml } from '../templates/email/otp.template.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      status: 'fail',
      message: 'Name, email, and password are required',
    });
  }

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

  const otp = generateOtp(6);
  const hash = await hashOtp(otp);

  const expiresAt = Date.now() + Number(process.env.OTP_EXPIRES_MINUTES || 5) * 60 * 1000;

  user.verification = {
    code: hash,
    expiresAt,
    createdAt: Date.now(),
  };

  await user.save();

  const html = getOtpHtml(otp);

  try {
    await sendEmail({
      to: user.email,
      subject: 'Verify your account',
      html,
    });
  } catch (err) {
    await user.deleteOne();
    return res.status(500).json({
      status: 'fail',
      message: 'Failed to send verification email. Please try again.',
    });
  }

  const sessionId = sessionService.createSession(user._id);

  res.cookie('sessionId', sessionId, cookieOptions).status(201).json({
    status: 'success',
    message: 'A verification code has been sent to your email',
  });
};

export const verify = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      status: 'fail',
      message: 'Email and otp are required',
    });
  }

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

  const isValidOtp = verifyOtp(otp, user.verification.otp);

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

  const sessionId = sessionService.createSession(user._id);

  res
    .cookie('sessionId', sessionId, cookieOptions)
    .status(200)
    .json({
      status: 'success',
      message: 'Logged in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
};

export const logout = async (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId)
    return res.status(400).json({ status: 'fail', message: 'User already logged out' });

  sessionService.deleteSession(sessionId);

  res.status(200).clearCookie('sessionId', cookieOptions).json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

export const getMe = async (req, res) => {
  res.status(200).json({ status: 'success', message: 'User fetched successfully', user: req.user });
};

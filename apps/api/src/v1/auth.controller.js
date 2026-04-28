import User from '../models/user.js';
import bcrypt from 'bcrypt';
import { generateOtp, hashOtp, verifyOtp } from '../utils/otp.js';
import { sendEmail } from '../services/email.js';
import { getOtpHtml } from '../templates/email/otp.template.js';

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
  } catch (err) {
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

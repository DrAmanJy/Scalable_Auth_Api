import User from '../models/user.js';
import { sendEmail } from '../services/email.js';
import { getOtpHtml } from '../templates/email/otp.template.js';
import { generateOtp, hashOtp, verifyOtp } from '../utils/otp.js';
import { createTokenV1, verifyHash } from '../utils/token.js';

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
    const expireAt = Date.now() + Number(process.env.OTP_EXPIRES_MINUTES) * 60 * 1000;

    newUser.verification = { code: hash, expireAt, createdAt: Date.now() };

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

    const accessToken = createTokenV1({ userId: newUser._id });

    res.status(201).json({
      status: 'success',
      message: 'User successfully register',
      user: newUser,
      accessToken,
    });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || 'Internal server error' });
  }
};

export const verify = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ status: 'fail', message: 'Email and opt required' });
  }

  const user = await User.findOne({ email }).select('+verification.code');

  if (!user) return res.status(400).json({ status: 'fail', message: 'Invalid email or OTP' });

  if (user.isVerified)
    return res.status(400).json({ status: 'fail', message: 'Account already verified' });

  const isExpired = Date.now() > user.verification?.expireAt || 0;

  if (isExpired)
    return res
      .status(400)
      .json({ status: 'fail', message: 'OTP has expired. Please request a new one.' });

  const isValidOtp = await verifyOtp(otp, user.verification?.code);

  if (!isValidOtp) return res.status(400).json({ status: 'fail', message: 'Invalid OTP' });

  user.isVerified = true;
  user.verification = undefined;

  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Account verified successfully.',
  });
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      res.status(400).json({ status: 'fail', message: 'All fields are required' });

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

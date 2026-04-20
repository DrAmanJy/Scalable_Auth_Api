import User from '../models/user.js';
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

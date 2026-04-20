import User from '../models/userV2';
import crypto from 'crypto';
import { createTokenV1, verifyHash, verifyToken } from '../utils/token';
import refreshTokenStorage from './auth.service';

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
  let deviceId = req.cookies.deviceId;

  if (!deviceId || typeof deviceId !== 'string') {
    deviceId = crypto.randomBytes(16).toString('hex');
  }

  let user;
  try {
    user = await User.create({ name, email, password });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ status: 'fail', message: 'Email already exists' });
    }
    throw err;
  }

  const accessToken = createTokenV1({ userId: user._id, role: user.role, deviceId }, 'access');
  const refreshToken = createTokenV1({ userId: user._id, role: user.role, deviceId }, 'refresh');

  await refreshTokenStorage.store(user._id, refreshToken, deviceId);

  res
    .status(201)
    .cookie('deviceId', deviceId, deviceCookieOptions)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json({ status: 'success', message: 'User successfully registered', user, accessToken });
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

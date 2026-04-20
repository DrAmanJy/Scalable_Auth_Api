import User from '../models/userV2';
import crypto from 'crypto';
import { createTokenV1} from '../utils/token';
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


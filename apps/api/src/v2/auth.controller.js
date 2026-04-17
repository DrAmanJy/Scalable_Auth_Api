import User from '../models/user.js';
import { createTokenV1, hashToken } from '../utils/token.js';
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
  const accessToken = createTokenV1({ id: user.id });
  const refreshToken = createTokenV1({ id: user.id }, 'refresh');

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

  const accessToken = createTokenV1({ id: user.id });
  const refreshToken = createTokenV1({ id: user.id }, 'refresh');

  const hashRefreshToken = await hashToken(refreshToken);

  user.refreshToken = hashRefreshToken;

  await user.save();

  res
    .status(200)
    .cookie('refreshToken', refreshToken, cookieOptions)
    .json({ status: 'success', message: 'User successfully login', user, accessToken });
};

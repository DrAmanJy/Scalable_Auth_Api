import bcrypt from 'bcrypt';
import User from '../models/user.js';
import sessionService from './session.service.js';

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
    if (err.code === 11000) {
      return res.status(400).json({ status: 'fail', message: 'Email already exists' });
    } else throw err;
  }

  const sessionId = sessionService.createSession(user._id);

  res
    .cookie('sessionId', sessionId, cookieOptions)
    .status(201)
    .json({ status: 'success', message: 'User successfully registered', user });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ status: 'fail', message: 'All fields are required' });

  const user = await User.findOne({ email }).select('+password');

  if (!user) return res.status(400).json({ status: 'fail', message: 'Email or password invalid' });

  const isPassValid = await bcrypt.compare(password, user.password);

  if (!isPassValid)
    return res.status(400).json({ status: 'fail', message: 'Email or password invalid' });

  const sessionId = sessionService.createSession(user._id);

  res
    .cookie('sessionId', sessionId, cookieOptions)
    .status(200)
    .json({ status: 'success', message: 'User successfully login', user });
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

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

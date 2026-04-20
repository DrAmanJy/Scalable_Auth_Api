import User from '../models/user.js';
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

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      res.status(400).json({ status: 'fail', message: 'All fields are required' });

    const existingUser = await User.findOne({ email }).select('+password');

    if (!existingUser)
      return res.status(400).json({ status: 'fail', message: 'Invalid email or password' });

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

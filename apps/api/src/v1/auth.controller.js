import User from '../models/user.js';
import bcrypt from 'bcrypt';

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
  res.status(201).json({ status: 'success', message: 'User successfully registered', user });
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

  res.status(200).json({ status: 'success', message: 'User successfully login', user });
};

export const getMe = async (req, res) => {
  res.status(200).json({ status: 'success', message: 'User fetched successfully', user: req.user });
};

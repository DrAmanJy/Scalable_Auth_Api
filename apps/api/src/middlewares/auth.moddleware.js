import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const isAuthV3 = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ status: 'fail', message: 'Not authorized, no token provided' });

  const accessToken = authHeader.split(' ')[1];
  if (!accessToken)
    return res.status(401).json({ status: 'fail', message: 'Invalid token format' });

  let decoded;
  try {
    decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }

  const user = await User.findById(decoded.id);
  if (!user)
    return res.status(401).json({ message: 'The user belonging to this token no longer exists' });

  req.user = user;
  next();
};

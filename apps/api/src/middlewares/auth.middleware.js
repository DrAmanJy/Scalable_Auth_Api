import bcrypt from 'bcrypt';
import User from '../models/user.js';
import { verifyToken } from '../utils/token.js';
import sessionService from '../v2/session.service.js';

export const requireBasicAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic '))
    return res
      .status(401)
      .json({ status: false, message: 'Not authorized, no credentials provided' });

  const base = authHeader.split(' ')[1];

  if (!base)
    return res
      .status(401)
      .json({ status: false, message: 'Not authorized, no credentials provided' });

  const decoded = Buffer.from(base, 'base64').toString('utf-8');
  const [email, password] = decoded.split(':');

  const user = await User.findOne({ email }).select('+password');
  if (!user)
    return res
      .status(401)
      .json({ status: false, message: 'Not authorized, invalid credentials provided' });

  const isPassValid = await bcrypt.compare(password, user.password);

  if (!isPassValid)
    return res
      .status(401)
      .json({ status: false, message: 'Not authorized, invalid credentials provided' });

  req.user = user;
  next();
};

export const requireSessionAuth = async (req, res, next) => {
  const sessionId = req.cookies.sessionId;
  if (!sessionId)
    return res
      .status(401)
      .json({ status: 'fail', message: 'Not authorized, no session id provided' });

  const session = sessionService.getSession(sessionId);

  if (!session)
    return res.status(401).json({ status: 'fail', message: 'Invalid or expired session' });

  const user = await User.findById(session.userId);

  if (!user)
    return res
      .status(401)
      .json({ status: 'fail', message: 'The user belonging to this token no longer exists' });

  req.user = user;
  next();
};

export const isAuthV3 = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ status: 'fail', message: 'Not authorized, no token provided' });

  const accessToken = authHeader.split(' ')[1];
  if (!accessToken)
    return res.status(401).json({ status: 'fail', message: 'Invalid token format' });

  const decoded = verifyToken(accessToken, 'access');

  if (!decoded) return res.status(401).json({ message: 'Invalid or expired access token' });

  const user = await User.findById(decoded.id);
  if (!user)
    return res.status(401).json({ message: 'The user belonging to this token no longer exists' });

  req.user = user;
  next();
};

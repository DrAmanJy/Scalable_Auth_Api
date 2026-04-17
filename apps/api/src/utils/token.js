import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export const createTokenV1 = (payload, type = 'access') => {
  const expiresIn =
    type === 'access' ? process.env.JWT_ACCESS_EXPIRES_IN : process.env.JWT_REFRESH_EXPIRES_IN;
  const secretKey =
    type === 'access' ? process.env.JWT_ACCESS_SECRET : process.env.JWT_REFRESH_SECRET;

  if (!secretKey || !expiresIn) {
    throw new Error(`Missing JWT config for ${type} token`);
  }

  return jwt.sign(payload, secretKey, { expiresIn });
};

export const hashToken = async (token) => {
  const saltRounds = 5;
  return await bcrypt.hash(token, saltRounds);
};

export const verifyToken = (token, type = 'refresh') => {
  const secretKey =
    type === 'access' ? process.env.JWT_ACCESS_SECRET : process.env.JWT_REFRESH_SECRET;

  return jwt.verify(token, secretKey);
};

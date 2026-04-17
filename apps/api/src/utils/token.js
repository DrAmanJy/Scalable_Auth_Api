import jwt from 'jsonwebtoken';

export const createTokenV1 = (payload, type = 'access') => {
  const expiresIn =
    type === 'access' ? process.env.JWT_ACCESS_EXPIRES_IN : process.env.JWT_REFRESH_EXPIRES_IN;
  const secretKey =
    type === 'access' ? process.env.JWT_ACCESS_SECRET : process.env.JWT_REFRESH_SECRET;

  return jwt.sign(payload, secretKey, { expiresIn });
};

import crypto from 'crypto';
import bcrypt from 'bcrypt';
export const generateOtp = (length = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max + 1).toString();
};

export const hashOtp = (otp) => {
  return bcrypt.hash(otp, 5);
};

export const verifyOtp = (otp, encrypted) => {
    if (!otp || !encrypted) return false
  return bcrypt.compare(otp, encrypted);
};

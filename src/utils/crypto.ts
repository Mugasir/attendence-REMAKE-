import bcrypt from 'bcryptjs';

export const hashValue = async (value: string): Promise<string> => bcrypt.hash(value, 12);
export const compareValue = async (value: string, hash: string): Promise<boolean> => bcrypt.compare(value, hash);

export const generateNumericOtp = (length: number): string => {
  let otp = '';
  for (let i = 0; i < length; i += 1) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

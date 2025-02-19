const generateOTP = (): string => {
  // Generate a 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export { generateOTP }; 
const generateOtp = (): number => {
  return Math.floor(10000 * Math.random());
};

export default generateOtp;

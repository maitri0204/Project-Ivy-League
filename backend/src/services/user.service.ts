import User from '../models/ivy/User';

export const getUsersByRole = async (role: string) => {
  const users = await User.find({ role }).select('_id name email role');
  return users;
};


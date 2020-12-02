import bcrypt from 'bcryptjs';
import UserModel, { IGameUser } from '../models/UserModel';

const debug = require('debug')('facade-with-db');

const getUsers = async (): Promise<Array<IGameUser>> => {
  const all = await UserModel.find();
  return all;
};

const getUser = async (userName: string): Promise<IGameUser> => {
  const user = await UserModel.findOne({ userName });
  if (!user) throw new Error('User not found');
  return user;
};

const addUser = async (user: IGameUser): Promise<IGameUser> => {
  const hash: string = await bcrypt.hash(user.password, 12);
  const newUser: IGameUser = await UserModel.create({
    ...user,
    password: hash
  });
  return newUser;
};

const deleteUser = async (userName: string): Promise<IGameUser> => {
  const user: IGameUser | null = await UserModel.findOne({ userName });
  if (!user) throw new Error('User does not exist');
  await UserModel.deleteOne({ userName });
  return user;
};

const authorizeUser = async (userName: string, password: string): Promise<IGameUser> => {
  try {
    const user = await getUser(userName);
    const authenticated = await bcrypt.compare(password, user.password);
    if (!authenticated) throw new Error('Invalid Password');
    return {
      ...user,
      password: ''
    };
  } catch (error) {
    console.log(error); // TODO - Remove before prod
    throw new Error('Invalid Credentials');
  }
};

export const UserFacade = {
  getUsers,
  getUser,
  addUser,
  deleteUser,
  authorizeUser
};

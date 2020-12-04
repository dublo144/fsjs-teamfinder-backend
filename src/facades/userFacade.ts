import bcrypt from 'bcryptjs';
import UserModel, { IGameUser } from '../models/UserModel';
import * as jwt from 'jsonwebtoken';

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
  await UserModel.remove({ userName });
  return user;
};

const authorizeUser = async (userName: string, password: string): Promise<IGameUser> => {
  try {
    const user: any = await getUser(userName);
    const authenticated = await bcrypt.compare(password, user.password);
    if (!authenticated) throw new Error('Invalid Password');
    const token = jwt.sign(
      {
        ...user._doc,
        password: ''
      },
      process.env.TOKEN_SECRET!,
      { expiresIn: '24h' } // change to 1h
    );
    return {
      ...user,
      password: '',
      token,
      tokenExpiration: 1
    };
  } catch (error) {
    console.log(error);
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

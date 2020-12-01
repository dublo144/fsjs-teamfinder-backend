import IGameUser from '../interfaces/GameUser';
import * as mongo from 'mongodb';
import bcrypt from 'bcryptjs';
import { getConnectedClient, closeConnection } from '../config/setupDB';
import { ApiError } from '../errors/apiError';

const debug = require('debug')('facade-with-db');

let userCollection: mongo.Collection;

export default class UserFacade {
  /*
  This method MUST be called before using the facade
  */
  static async initDB(client: mongo.MongoClient) {
    const dbName = process.env.DB_NAME;
    if (!dbName) {
      throw new Error('Database name not provided');
    }
    try {
      userCollection = client.db(dbName).collection('users');
      debug(`userCollection initialized on database '${dbName}'`);
    } catch (err) {
      console.error('Could not create connection', err);
    }
  }

  static async addUser(user: IGameUser): Promise<IGameUser> {
    const hash: string = await bcrypt.hash(user.password, 12);
    let newUser = { ...user, password: hash };
    await userCollection.insertOne(newUser);
    return newUser;
  }

  static async deleteUser(userName: string): Promise<string> {
    const status = await userCollection.deleteOne({ userName });
    if (status.deletedCount === 1) {
      return 'User was deleted';
    }
    throw new ApiError('User could not be deleted', 400);
  }
  //static async getAllUsers(): Promise<Array<IGameUser>> {
  static async getAllUsers(proj?: object): Promise<Array<any>> {
    const users = await userCollection.find({}, { projection: proj }).toArray();
    return users;
  }

  static async getUser(userName: string, proj?: object): Promise<IGameUser> {
    const user = await userCollection.findOne({ userName });
    return user;
  }

  static async checkUser(userName: string, password: string): Promise<boolean> {
    try {
      const user = await UserFacade.getUser(userName);
      if (user == null) {
        throw new Error('User not found');
      }
      const authenticated = await bcrypt.compare(password, user.password);
      if (!authenticated) throw new Error('Invalid Password');
      return authenticated;
    } catch (error) {
      throw new Error('Invalid Credentials');
    }
  }
}

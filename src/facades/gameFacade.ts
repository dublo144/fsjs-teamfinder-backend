import IPoint from '../interfaces/Point';
import * as mongo from 'mongodb';
import { ApiError } from '../errors/apiError';
import UserFacade from './userFacadeWithDB';
import IPosition from '../interfaces/Position';
import IPost from '../interfaces/Post';
import { positionCreator } from '../utils/geoUtils';
import { POSITION_COLLECTION_NAME, POST_COLLECTION_NAME } from '../config/collectionNames';
const debug = require('debug')('game-facade');
let positionCollection: mongo.Collection;
let postCollection: mongo.Collection;
const EXPIRES_AFTER = 30;

export default class GameFacade {
  static readonly DIST_TO_CENTER = 15;
  static dbIsReady = false;

  static isDbReady() {
    if (!GameFacade.dbIsReady) {
      throw new Error(`######## initDB MUST be called BEFORE using this facade ########`);
    }
  }

  static async initDB(client: mongo.MongoClient) {
    const dbName = process.env.DB_NAME;
    debug(`Database ${dbName} about to be setup: ${client}`);
    if (!dbName) {
      throw new Error('Database name not provided');
    }

    //Setup the Facade
    await UserFacade.initDB(client);

    try {
      positionCollection = await client.db(dbName).collection(POSITION_COLLECTION_NAME);
      debug(`positionCollection initialized on database '${dbName}'`);
    } catch (err) {
      console.error('Could not create connection', err);
    }

    //TODO
    //1) Create expiresAfterSeconds index on lastUpdated
    positionCollection.createIndex({ lastUpdated: 1 }, { expireAfterSeconds: EXPIRES_AFTER });

    //2) Create 2dsphere index on location
    positionCollection.createIndex({ location: '2dsphere' });

    //TODO uncomment if you plan to do this part of the exercise
    ///postCollection = client.db(dbName).collection(POST_COLLECTION_NAME);
    //await postCollection.createIndex({ location: "2dsphere" })

    GameFacade.dbIsReady = true;
  }

  static async nearbyPlayers(
    userName: string,
    password: string,
    longitude: number,
    latitude: number,
    distance: number
  ) {
    GameFacade.isDbReady();
    try {
      //Step-1. Find the user, and if found continue
      // Use relevant methods in the user facade
      await UserFacade.checkUser(userName, password);
    } catch (err) {
      throw new ApiError('Wrong username or password', 403);
    }

    try {
      //If logged in update (or create if this is the first login) his position
      const point = { type: 'Point', coordinates: [longitude, latitude] };
      const now = new Date();
      /*It's important you know what to do her. Remember a document for this user does
        not neccesarily exist. If not, you must create it, in not found (see what you can do wit upsert)
        Also remember to set a new timeStamp (use the date created above), since this document should only live for a
        short time */

      //Add what we are searching for (the userName in a Position Document)
      const query = { userName: userName };

      // Add what needs to be added here, remember the document might NOT exist yet
      const update = {
        $set: {
          lastUpdated: now
        }
      };
      // Figure out why you probably need to set both of these
      // Upsert will create a new doc if the filter returns nothing and return null
      // ReturnNewDocument will unsure that we return the newly created document if thats the case
      const opts = { upsert: true, returnNewDocument: true };

      await positionCollection.findOneAndUpdate(query, update, opts);

      /* TODO
         By know we have updated (or created) the callers position-document
         Next step is to see if we can find any nearby players, friends or whatever you call them
         */
      const nearbyPlayers = await GameFacade.findNearbyPlayers(userName, point, distance);

      //If anyone found,  format acording to requirements
      const formatted = nearbyPlayers.map((player) => {
        return {
          userName: player.userName,
          // Complete this, using the requirements
          lat: player.location.coordinates[0],
          lon: player.location.coordinates[1]
        };
      });
      return formatted;
    } catch (err) {
      throw err;
    }
  }

  static async findNearbyPlayers(clientUserName: string, point: IPoint, distance: number): Promise<Array<IPosition>> {
    GameFacade.isDbReady();
    try {
      const found = positionCollection.find({
        // Figure out what to add here.Hint --> Take a look at the $near operator
        location: {
          $near: {
            $geometry: point,
            $maxDistance: distance
          }
        },
        userName: {
          $ne: clientUserName
        }
      });
      return found.toArray();
    } catch (err) {
      throw err;
    }
  }

  static async getPostIfReached(postId: string, lat: number, lon: number): Promise<any> {
    GameFacade.isDbReady();
    try {
      const post: IPost | null = await postCollection.findOne({
        _id: postId,
        location: {
          $near: {}
          // Todo: Complete this
        }
      });
      if (post === null) {
        throw new ApiError('Post not reached', 400);
      }
      return { postId: post._id, task: post.task.text, isUrl: post.task.isUrl };
    } catch (err) {
      throw err;
    }
  }

  //You can use this if you like, to add new post's via the facade
  static async addPost(
    name: string,
    taskTxt: string,
    isURL: boolean,
    taskSolution: string,
    lon: number,
    lat: number
  ): Promise<IPost> {
    GameFacade.isDbReady();
    const position = { type: 'Point', coordinates: [lon, lat] };
    const status = await postCollection.insertOne({
      _id: name,
      task: { text: taskTxt, isURL },
      taskSolution,
      location: {
        type: 'Point',
        coordinates: [lon, lat]
      }
    });
    const newPost: any = status.ops;
    return newPost as IPost;
  }
}

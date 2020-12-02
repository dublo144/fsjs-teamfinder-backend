import IPoint from '../interfaces/Point';
import { UserFacade } from './userFacade';
import PositionModel, { IPosition } from '../models/PositionModel';

const debug = require('debug')('game-facade');

const nearbyPlayers = async (
  userName: string,
  password: string,
  longitude: number,
  latitude: number,
  distance: number
) => {
  await UserFacade.authorizeUser(userName, password);

  const point = { type: 'Point', coordinates: [longitude, latitude] };
  const now = new Date();

  const filter = { userName };
  const update = { lastUpdated: now };
  const opts = { upsert: true, new: true };

  await PositionModel.findOneAndUpdate(filter, update, opts);

  const nearbyPlayers = await findNearbyPlayers(userName, point, distance);

  return nearbyPlayers.map((player) => ({
    userName: player.userName,
    lat: player.location.coordinates[0],
    lon: player.location.coordinates[1]
  }));
};

const findNearbyPlayers = async (
  clientUserName: string,
  point: IPoint,
  distance: number
): Promise<Array<IPosition>> => {
  const found = await PositionModel.find({
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
  return found;
};

export const GameFacade = {
  findNearbyPlayers,
  nearbyPlayers
};

// async function getPostIfReached(postId: string, lat: number, lon: number): Promise<any> {
//   try {
//     const post: IPost | null = await postCollection.findOne({
//       _id: postId,
//       location: {
//         $near: {}
//         // Todo: Complete this
//       }
//     });
//     if (post === null) {
//       throw new ApiError('Post not reached', 400);
//     }
//     return { postId: post._id, task: post.task.text, isUrl: post.task.isUrl };
//   } catch (err) {
//     throw err;
//   }
// }

// //You can use this if you like, to add new post's via the facade
// async function addPost(
//   name: string,
//   taskTxt: string,
//   isURL: boolean,
//   taskSolution: string,
//   lon: number,
//   lat: number
// ): Promise<IPost> {
//   const position = { type: 'Point', coordinates: [lon, lat] };
//   const status = await postCollection.insertOne({
//     _id: name,
//     task: { text: taskTxt, isURL },
//     taskSolution,
//     location: {
//       type: 'Point',
//       coordinates: [lon, lat]
//     }
//   });
//   const newPost: any = status.ops;
//   return newPost as IPost;
// }

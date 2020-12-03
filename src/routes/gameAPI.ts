import express from 'express';
import { ApiError } from '../errors/apiError';
import { GameFacade } from '../facades/gameFacade';
import { IGameUser } from '../models/UserModel';

export const router = express.Router();

router.get('/createGameArea', async (req, res, next) => {
  await GameFacade.createGameArea();
  return res.json('success!');
});

router.post('/nearbyplayers', async function (req: any, res, next) {
  try {
    const user: IGameUser = req.user;
    if (!user) throw new ApiError('Invalid Credentials', 403);
    const { newPosition } = req.body;
    const response = await GameFacade.nearbyPlayers(
      user,
      Number(newPosition.lon),
      Number(newPosition.lat),
      Number(newPosition.distance)
    );
    return res.json(response);
  } catch (err) {
    next(err);
  }
});

router.post('/getPostIfReached', async function (req, res, next) {
  throw new Error('Not yet implemented');
});

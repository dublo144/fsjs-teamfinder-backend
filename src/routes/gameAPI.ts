import express from 'express';
import { GameFacade } from '../facades/gameFacade';

export const router = express.Router();

//Just to check this router is up and running
router.get('/', async function (req, res, next) {
  res.json({ msg: 'game API' });
});

router.post('/nearbyplayers', async function (req, res, next) {
  try {
    const { userName, password, lat, lon, distance } = req.body;
    const response = await GameFacade.nearbyPlayers(userName, password, Number(lon), Number(lat), Number(distance));
    return res.json(response);
  } catch (err) {
    next(err);
  }
});

router.post('/getPostIfReached', async function (req, res, next) {
  throw new Error('Not yet implemented');
});

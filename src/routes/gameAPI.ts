import express from 'express';
import { getConnectedClient } from '../config/setupDB';
import GameFacade from '../facades/gameFacade';

export const router = express.Router();
let dbInitialized = false;

(async function initDb() {
  const client = await getConnectedClient();
  await GameFacade.initDB(client);
  dbInitialized = true;
})();

router.use((req, res, next) => {
  if (dbInitialized) {
    return next();
  }
  return res.json({ info: 'DB not ready, try again' });
});

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

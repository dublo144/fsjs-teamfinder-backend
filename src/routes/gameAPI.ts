import express from 'express';
import { getConnectedClient } from '../config/setupDB';
import UserFacade from '../facades/userFacadeWithDB';
import GameFacade from '../facades/gameFacade';

export const router = express.Router();
let dbInitialized = false;

(async function initDb() {
  const client = await getConnectedClient();
  await UserFacade.initDB(client);
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
    //Read the exercise and check what must be sent with the request. Grab this information from the request body, and
    //call the method (the skeleton is already there) nearbyPlayers(....) in the gameFacade and send back the result to the client
    const response = await GameFacade.nearbyPlayers(userName, password, Number(lon), Number(lat), Number(distance));
    return res.json(response);
  } catch (err) {
    next(err);
  }
});

router.post('/getPostIfReached', async function (req, res, next) {
  throw new Error('Not yet implemented');
});
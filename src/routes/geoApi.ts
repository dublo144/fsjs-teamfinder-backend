import express from 'express';
import { gameArea, players } from '../utils/gameData.js';
import { getConnectedClient } from '../config/setupDB';
import UserFacade from '../facades/userFacadeWithDB';
import GameFacade from '../facades/gameFacade';

const gju = require('geojson-utils');

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

const polygonForClient = {
  coordinates: gameArea.coordinates[0].map((point) => {
    return { latitude: point[1], longitude: point[0] };
  })
};

router.get('/gamearea', (req, res) => {
  console.log('hello');
  res.json(polygonForClient);
});

router.get('/isuserinarea/:lon/:lat', (req, res) => {
  const lon = req.params.lon;
  const lat = req.params.lat;
  const point = { type: 'Point', coordinates: [lon, lat] };
  let isInside = gju.pointInPolygon(point, gameArea);
  let result = {
    status: isInside,
    msg: isInside ? 'Point was inside the tested polygon' : 'Point was NOT inside tested polygon'
  };
  res.json(result);
});

router.get('/findNearbyPlayers/:lon/:lat/:rad', (req, res) => {
  const { lon, lat, rad } = req.params;
  const point = { type: 'Point', coordinates: [lon, lat] };
  let isInside = gju.pointInPolygon(point, gameArea);
  let result: any[] = [];
  players.forEach((player) => {
    if (gju.geometryWithinRadius(player.geometry, point, rad)) {
      result.push(player);
    }
  });
  res.json(result);
});

router.get('/distanceToUser/:lon/:lat/:username', (req, res) => {
  const { lon, lat, username } = req.params;
  const point = { type: 'Point', coordinates: [Number(lon), Number(lat)] };
  console.log(point, username);
  const user = players.find((player) => {
    return player.properties.name === username;
  });
  if (!user) {
    res.status(404);
    return res.json({ msg: 'User not found' });
  }
  let distance = gju.pointDistance(point, user.geometry);
  const result = { distance: distance, to: username };
  res.json(result);
});
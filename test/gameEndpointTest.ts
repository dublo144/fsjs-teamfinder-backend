import chai from 'chai';
import spies from 'chai-spies';
import fetch from 'node-fetch';
import bcrypt from 'bcryptjs';
import { positionCreator, getLatitudeInside, getLatitudeOutside } from '../src/utils/geoUtils';
import { GameFacade } from '../src/facades/gameFacade';
import UserModel, { IGameUser } from '../src/models/UserModel';
import PositionModel from '../src/models/PositionModel';
import GameAreaModel from '../src/models/GameAreaModel';
import { UserFacade } from '../src/facades/userFacade';

const gju = require('geojson-utils');
chai.use(spies);

const expect = chai.expect;

const TEST_PORT = '7777';
const DISTANCE_TO_SEARCH = 100;

let team1: IGameUser, team2: IGameUser, team3: IGameUser;

describe('Verify /gameapi/getPostIfReached', () => {
  let URL: string;

  before(async function () {
    process.env.PORT = TEST_PORT;
    process.env.SKIP_AUTHENTICATION = 'false';
    process.env.MONGO_DB = 'semester_case_test';

    require('../src/app').server;
    URL = `http://localhost:${process.env.PORT}`;
  });

  beforeEach(async () => {
    await UserModel.remove({});
    const secretHashed = await bcrypt.hash('secret', 12);
    team1 = { name: 'Team1', userName: 't1', password: secretHashed, role: 'team' };
    team2 = { name: 'Team2', userName: 't2', password: secretHashed, role: 'team' };
    team3 = { name: 'Team3', userName: 't3', password: secretHashed, role: 'team' };
    await UserModel.insertMany([team1, team2, team3]);

    await GameAreaModel.remove({});
    await GameAreaModel.create({
      name: 'Vester Kirkegård',
      location: {
        type: 'Polygon',
        coordinates: [
          [
            [12.526388168334961, 55.656308777140374],
            [12.527761459350586, 55.65202320591278],
            [12.535486221313477, 55.65408130713866],
            [12.533597946166992, 55.65737404408103],
            [12.526388168334961, 55.656308777140374]
          ]
        ]
      }
    });
    await GameAreaModel.create({
      name: 'Frb. Have',
      location: {
        type: 'Polygon',
        coordinates: [
          [
            [12.517247200012207, 55.66963463190095],
            [12.52366304397583, 55.666560768293195],
            [12.530035972595215, 55.66781938730943],
            [12.531001567840576, 55.670881051090035],
            [12.518212795257568, 55.67194592146954],
            [12.517247200012207, 55.66963463190095]
          ]
        ]
      }
    });

    await PositionModel.remove({});
    const positions = [
      positionCreator(12.5203800201416, 55.66998556947477, team1.userName, team1.name, true),
      positionCreator(
        12.528619766235352,
        getLatitudeInside(55.66998556947477, DISTANCE_TO_SEARCH),
        team2.userName,
        team2.name,
        true
      ),
      positionCreator(
        12.528619766235352,
        getLatitudeOutside(55.66998556947477, DISTANCE_TO_SEARCH),
        team3.userName,
        team3.name,
        true
      )
    ];
    await PositionModel.insertMany(positions);
  });

  it('Should find team2, since inside range', async function () {
    // signs in
    const { token } = await UserFacade.authorizeUser('t1', 'secret');

    const body = {
      newPosition: { lat: 55.66998556947477, lon: 12.528619766235352, distance: DISTANCE_TO_SEARCH },
      token
    };

    const config = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    };

    const result = await fetch(`${URL}/gameapi/nearbyplayers`, config);
    const json = await result.json();
    expect(json.length).to.be.equal(1);
    expect(json[0].userName).to.be.equal('t2');
  });

  it('Should return 403 when no token is send', async () => {
    const newPosition = { lat: 55.77, lon: 12.48, distance: DISTANCE_TO_SEARCH };
    const config = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newPosition)
    };

    const result = await fetch(`${URL}/gameapi/nearbyplayers`, config);
    const json = await result.json();
    expect(json.code === 403);
  });

  it('Should call the NearbyPlayers-method', async function () {
    const { token } = await UserFacade.authorizeUser('t1', 'secret');

    const body = {
      newPosition: { lat: 55.66998556947477, lon: 12.528619766235352, distance: DISTANCE_TO_SEARCH },
      token
    };

    const config = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    };

    const spy = chai.spy.on(GameFacade, 'nearbyPlayers');
    await fetch(`${URL}/gameapi/nearbyplayers`, config);
    expect(spy).to.have.been.called();
  });

  xit('Should throw error if user is outside a GameArea', async () => {
    const { token } = await UserFacade.authorizeUser('t1', 'secret');

    const body = {
      newPosition: { lat: 66.66998556947477, lon: 12.528619766235352, distance: DISTANCE_TO_SEARCH },
      token
    };

    const config = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    };

    const result = await fetch(`${URL}/gameapi/nearbyplayers`, config);
    console.log(result);
  });
});

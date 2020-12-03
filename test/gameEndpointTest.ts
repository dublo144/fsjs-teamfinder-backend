import chai from 'chai';
import spies from 'chai-spies';
import fetch from 'node-fetch';
import bcrypt from 'bcryptjs';

import { positionCreator, getLatitudeInside, getLatitudeOutside } from '../src/utils/geoUtils';
import { GameFacade } from '../src/facades/gameFacade';
import UserModel from '../src/models/UserModel';
import PositionModel from '../src/models/PositionModel';

chai.use(spies);

const expect = chai.expect;

const TEST_PORT = '7777';
const DISTANCE_TO_SEARCH = 100;

describe('Verify /gameapi/getPostIfReached', () => {
  let URL: string;

  before(async function () {
    process.env.PORT = TEST_PORT;
    process.env.SKIP_AUTHENTICATION = 'true';
    process.env.DB_NAME = 'semester_case_test';

    require('../src/app').server;
    URL = `http://localhost:${process.env.PORT}`;
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
    const secretHashed = await bcrypt.hash('secret', 12);
    const team1 = { name: 'Team1', userName: 't1', password: secretHashed, role: 'team' };
    const team2 = { name: 'Team2', userName: 't2', password: secretHashed, role: 'team' };
    const team3 = { name: 'Team3', userName: 't3', password: secretHashed, role: 'team' };

    await UserModel.insertMany([team1, team2, team3]);

    await PositionModel.deleteMany({});
    const positions = [
      positionCreator(12.48, 55.77, team1.userName, team1.name, true),
      positionCreator(12.48, getLatitudeInside(55.77, DISTANCE_TO_SEARCH), team2.userName, team2.name, true),
      positionCreator(12.48, getLatitudeOutside(55.77, DISTANCE_TO_SEARCH), team3.userName, team3.name, true)
    ];
    await PositionModel.insertMany(positions);
  });

  it('Should find team2, since inside range', async function () {
    const newPosition = { userName: 't1', password: 'secret', lat: 55.77, lon: 12.48, distance: DISTANCE_TO_SEARCH };
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
    expect(json.length).to.be.equal(1);
    expect(json[0].userName).to.be.equal('t2');
  });

  xit('Should return 403 when invalid credentials', async () => {
    const newPosition = { userName: 'hulabula', password: 123, lat: 55.77, lon: 12.48, distance: DISTANCE_TO_SEARCH };

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

  it('Should call the NearbyPlayers-method with the correct username and PW', async function () {
    const newPosition = { userName: 't1', password: 'secret', lat: 55.77, lon: 12.48, distance: DISTANCE_TO_SEARCH };

    const config = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newPosition)
    };

    const spy = chai.spy.on(GameFacade, 'nearbyPlayers');
    await fetch(`${URL}/gameapi/nearbyplayers`, config);
    expect(spy).to.have.been.called().with('t1', 'secret');
  });
});

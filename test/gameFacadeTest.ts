import { GameFacade } from '../src/facades/gameFacade';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import bcrypt from 'bcryptjs';
import { positionCreator, getLatitudeOutside, getLatitudeInside } from '../src/utils/geoUtils';
import mongoose from 'mongoose';
import UserModel, { IGameUser } from '../src/models/UserModel';
import PositionModel, { IPosition } from '../src/models/PositionModel';
import { UserFacade } from '../src/facades/userFacade';
import GameAreaModel from '../src/models/GameAreaModel';

chai.use(chaiAsPromised);

const DISTANCE_TO_SEARCH = 100;
let team1: IGameUser, team2: IGameUser, team3: IGameUser;

describe('########## Verify the Game Facade ##########', () => {
  before(async function () {
    mongoose
      .connect(
        `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PW}@cluster0-wabpp.mongodb.net/${process.env.MONGO_DB_TEST}?retryWrites=true&w=majority`,
        { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }
      )
      .then(() => {
        console.log(`🚀 Connected to ${process.env.MONGO_DB_TEST} 🚀`);
      })
      .catch((e) => console.log(e));
  });

  beforeEach(async () => {
    await UserModel.remove({});
    const secretHashed: string = await bcrypt.hash('secret', 12);

    team1 = { name: 'Team1', userName: 't1', password: secretHashed, role: 'team' };
    team2 = { name: 'Team2', userName: 't2', password: secretHashed, role: 'team' };
    team3 = { name: 'Team3', userName: 't3', password: secretHashed, role: 'team' };
    await UserModel.insertMany([team1, team2, team3]);

    await PositionModel.remove({});
    const positions: Array<IPosition> = [
      positionCreator(12.52415657043457, 55.66892064574196, team1.userName, team1.name, true),
      positionCreator(
        12.52415657043457,
        getLatitudeInside(55.66892064574196, DISTANCE_TO_SEARCH),
        team2.userName,
        team2.name,
        true
      ),
      positionCreator(
        12.52415657043457,
        getLatitudeOutside(55.66892064574196, DISTANCE_TO_SEARCH),
        team3.userName,
        team3.name,
        true
      )
    ];
    await PositionModel.insertMany(positions);

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
  });

  describe('Verify nearbyPlayers', () => {
    it('Should find (Only) Team2', async () => {
      const playersFound = await GameFacade.nearbyPlayers(
        team1,
        12.52415657043457,
        55.66892064574196,
        DISTANCE_TO_SEARCH
      );
      expect(playersFound.length).to.be.equal(1);
      expect(playersFound[0].userName).to.be.equal('t2');
    });

    it('Should find Frb. Have game area for user', async () => {
      await GameFacade.updateUserLocation(team1.userName, 12.526988983154297, 55.66640343806983);
      const gameAreas = await GameFacade.getAllGameAreasWithinRadius(12.526988983154297, 55.66640343806983, 500);
      expect(gameAreas.length).to.be.equal(1);
      expect(gameAreas[0].name).to.be.equal('Frb. Have');
    });

    it('Should find Frb. Have and Vester kirkegård for user', async () => {
      await GameFacade.updateUserLocation(team1.userName, 12.526988983154297, 55.66640343806983);
      const gameAreas = await GameFacade.getAllGameAreasWithinRadius(12.526988983154297, 55.66640343806983, 2000);
      expect(gameAreas.length).to.be.equal(2);
      expect(gameAreas[0].name).to.be.equal('Frb. Have');
      expect(gameAreas[1].name).to.be.equal('Vester Kirkegård');
    });

    it('Should throw error if user is outside a game area', async () => {
      await expect(GameFacade.nearbyPlayers(team1, 66, 60, DISTANCE_TO_SEARCH)).to.be.rejectedWith(
        'User is not inside a game area'
      );
    });
  });

  describe('Verify getPostIfReached', () => {
    xit('Should find the post since it was reached', async () => {
      //TODO
    });

    xit('Should NOT find the post since it was NOT reached', async () => {
      //TODO
    });
  });
});

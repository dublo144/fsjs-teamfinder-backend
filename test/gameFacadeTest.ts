import { GameFacade } from '../src/facades/gameFacade';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import bcrypt from 'bcryptjs';
import { positionCreator, getLatitudeOutside, getLatitudeInside } from '../src/utils/geoUtils';
import mongoose from 'mongoose';
import UserModel, { IGameUser } from '../src/models/UserModel';
import PositionModel, { IPosition } from '../src/models/PositionModel';

chai.use(chaiAsPromised);

const DISTANCE_TO_SEARCH = 100;

describe.only('########## Verify the Game Facade ##########', () => {
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
    await UserModel.deleteMany({});
    const secretHashed: string = await bcrypt.hash('secret', 12);

    const team1: IGameUser = { name: 'Team1', userName: 't1', password: secretHashed, role: 'team' };
    const team2: IGameUser = { name: 'Team2', userName: 't2', password: secretHashed, role: 'team' };
    const team3: IGameUser = { name: 'Team3', userName: 't3', password: secretHashed, role: 'team' };
    await UserModel.insertMany([team1, team2, team3]);

    await PositionModel.deleteMany({});

    const positions: Array<IPosition> = [
      positionCreator(12.48, 55.77, team1.userName, team1.name, true),
      positionCreator(12.48, getLatitudeInside(55.77, DISTANCE_TO_SEARCH), team2.userName, team2.name, true),
      positionCreator(12.48, getLatitudeOutside(55.77, DISTANCE_TO_SEARCH), team3.userName, team3.name, true)
    ];
    await PositionModel.insertMany(positions);

    //Only include this if you plan to do this part
    /*await postCollection.deleteMany({})
    await postCollection.insertOne({
      _id: "Post1",
      task: { text: "1+1", isUrl: false },
      taskSolution: "2",
      location: {
        type: "Point",
        coordinates: [12.49, 55.77]
      }
    });*/
  });

  describe('Verify nearbyPlayers', () => {
    it('Should find (Only) Team2', async () => {
      const playersFound = await GameFacade.nearbyPlayers('t1', 'secret', 12.48, 55.77, DISTANCE_TO_SEARCH);
      expect(playersFound.length).to.be.equal(1);
      expect(playersFound[0].userName).to.be.equal('t2');
    });

    it('Should not find Team2 (wrong credentials)', async () => {
      await expect(GameFacade.nearbyPlayers('t1', 'xxxxx', 12.48, 55.77, DISTANCE_TO_SEARCH)).to.be.rejectedWith(
        'Invalid Credentials'
      );
    });

    it('Should find Team2 and Team3', async () => {
      const playersFound = await GameFacade.nearbyPlayers('t1', 'secret', 12.48, 55.77, DISTANCE_TO_SEARCH + 200);
      expect(playersFound.length).to.be.equal(2);
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

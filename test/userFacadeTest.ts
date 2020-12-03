import { UserFacade } from '../src/facades/userFacade';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import UserModel, { IGameUser } from '../src/models/UserModel';

const debug = require('debug')('facade-with-db:test');

// Setup Chai with additional features to test async
const expect = chai.expect;
chai.use(chaiAsPromised);

describe('########## User Facade Test ##########', () => {
  before(async function () {
    mongoose
      .connect(
        `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PW}@cluster0-wabpp.mongodb.net/${process.env.MONGO_DB_TEST}?retryWrites=true&w=majority`,
        { useNewUrlParser: true, useUnifiedTopology: true }
      )
      .then(() => {
        console.log(`🚀 Connected to ${process.env.MONGO_DB_TEST} 🚀`);
      })
      .catch((e) => console.log(e));
  });

  beforeEach(async () => {
    await UserModel.remove({});
    const secretHashed = await bcrypt.hash('secret', 12);

    const testUsers: Array<IGameUser> = [
      {
        name: 'Peter Pan',
        userName: 'pp@b.dk',
        password: secretHashed,
        role: 'user'
      },
      {
        name: 'Donald Duck',
        userName: 'dd@b.dk',
        password: secretHashed,
        role: 'user'
      },
      {
        name: 'admin',
        userName: 'admin@a.dk',
        password: secretHashed,
        role: 'admin'
      }
    ];
    await UserModel.insertMany(testUsers);
  });

  it('Should Add the user Jan', async () => {
    const newUser = {
      name: 'Jan Olsen',
      userName: 'jo@b.dk',
      password: 'secret',
      role: 'user',
      position: null
    };
    const user = await UserFacade.addUser(newUser);
    expect(user.name).to.be.equal('Jan Olsen');
  });

  it('Should remove the user Peter', async () => {
    const user = await UserFacade.deleteUser('pp@b.dk');
    expect(user.name).to.equal('Peter Pan');
  });

  it('Should get three users', async () => {
    const users = await UserFacade.getUsers();
    expect(users.length).to.equal(3);
  });

  it('Should find Donald Duck', async () => {
    const user = await UserFacade.getUser('dd@b.dk');
    expect(user.userName).to.equal('dd@b.dk');
  });

  it('Should not find xxx.@.b.dk', async () => {
    await expect(UserFacade.getUser('xxx.@.b.dk')).to.be.rejectedWith('User not found');
  });

  it("Should correctly validate Peter Pan's credential,s", async () => {
    const user = await UserFacade.authorizeUser('pp@b.dk', 'secret');
    expect(user.password).to.equal('');
  });

  it("Should NOT correctly validate Peter Pan's check", async () => {
    await expect(UserFacade.authorizeUser('pp@b.dk', 'xxxx')).to.rejectedWith('Invalid Credentials');
  });

  it('Should NOT correctly validate non-existing users check', async () => {
    await expect(UserFacade.authorizeUser('pxxxx@b.dk', 'secret')).to.be.rejectedWith('Invalid Credentials');
  });
});

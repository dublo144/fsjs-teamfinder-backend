import * as mongo from 'mongodb';
import { getConnectedClient, closeConnection } from '../src/config/setupDB';
import UserFacade from '../src/facades/userFacadeWithDB';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import bcrypt from 'bcryptjs';

const debug = require('debug')('facade-with-db:test');
let userCollection: mongo.Collection | null;
let client: mongo.MongoClient;

// Setup Chai with additional features to test async
const expect = chai.expect;
chai.use(chaiAsPromised);

describe('########## Verify the UserFacade with a DataBase ##########', () => {
  before(async function () {
    //Change mocha's default timeout, since we are using a "slow" remote database for testing
    this.timeout(Number(process.env['MOCHA_TIMEOUT']));
    client = await getConnectedClient();
    process.env['DB_NAME'] = 'semester_case_test';
    await UserFacade.initDB(client);
    userCollection = client.db(process.env['DB_NAME']).collection('users');
  });

  after(async () => {
    //await closeConnection();
  });

  beforeEach(async () => {
    if (userCollection === null) {
      throw new Error('userCollection not set');
    }
    await userCollection.deleteMany({});
    const secretHashed = await bcrypt.hash('secret', 12);
    await userCollection.insertMany([
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
    ]);
  });

  it('Should Add the user Jan', async () => {
    const newUser = {
      name: 'Jan Olsen',
      userName: 'jo@b.dk',
      password: 'secret',
      role: 'user'
    };
    const user = await UserFacade.addUser(newUser);
    expect(user.name).to.be.equal('Jan Olsen');

    if (userCollection === null) {
      throw new Error('Collection was null');
    }
    const jan = await userCollection.findOne({ userName: 'jo@b.dk' });
    expect(jan.name).to.be.equal('Jan Olsen');
  });

  it('Should remove the user Peter', async () => {
    const status = await UserFacade.deleteUser('pp@b.dk');
    expect(status).to.equal('User was deleted');
  });

  it('Should get three users', async () => {
    const users = await UserFacade.getAllUsers();
    expect(users.length).to.equal(3);
  });

  it('Should find Donald Duck', async () => {
    const user = await UserFacade.getUser('dd@b.dk');
    expect(user.userName).to.equal('dd@b.dk');
  });

  it('Should not find xxx.@.b.dk', async () => {
    const user = await UserFacade.getUser('xxx.@.b.dk');
    expect(user).to.be.null;
  });

  it("Should correctly validate Peter Pan's credential,s", async () => {
    const status = await UserFacade.checkUser('pp@b.dk', 'secret');
    expect(status).to.be.true;
  });

  it("Should NOT correctly validate Peter Pan's check", async () => {
    await expect(UserFacade.checkUser('pp@b.dk', 'xxxx')).to.rejectedWith('Invalid Credentials');
  });

  it('Should NOT correctly validate non-existing users check', async () => {
    await expect(UserFacade.checkUser('pxxxx@b.dk', 'secret')).to.be.rejectedWith('Invalid Credentials');
  });
});

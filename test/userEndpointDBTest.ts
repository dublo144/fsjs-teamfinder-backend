import { expect } from 'chai';
import { Server } from 'http';
import fetch from 'node-fetch';
import bcrypt from 'bcryptjs';
import { getConnectedClient } from '../src/config/setupDB';

const debug = require('debug')('user-endpoint-test');

let server: Server;
const TEST_PORT = '7777';

describe('####### Verify the User Endpoints (/api/users) ##########', function () {
  //Change mocha's default timeout, since we are using a "slow" remote database for testing
  this.timeout(Number(process.env.MOCHA_TIMEOUT));
  let URL: string;

  before(async function () {
    process.env.PORT = TEST_PORT;
    process.env.SKIP_AUTHENTICATION = 'true';
    process.env.DB_NAME = 'semester_case_test';

    const client = await getConnectedClient();
    const db = client.db(process.env.DB_NAME);
    usersCollection = db.collection('users');

    server = require('../src/app').server;
    URL = `http://localhost:${process.env.PORT}`;
    // done();
  });

  let usersCollection: any;
  beforeEach(async function () {
    //Observe, no use of facade, but operates directly on connection
    // const client = await getConnectedClient("From UserEndpoint Test");
    // const db = client.db(process.env.DB_NAME)

    // usersCollection = db.collection("users")
    await usersCollection.deleteMany({});
    const secretHashed = await bcrypt.hash('secret', 12);
    await usersCollection.insertMany([
      { name: 'Peter Pan', userName: 'pp@b.dk', password: secretHashed, role: 'user' },
      { name: 'Donald Duck', userName: 'dd@b.dk', password: secretHashed, role: 'user' },
      { name: 'admin', userName: 'admin@a.dk', password: secretHashed, role: 'admin' }
    ]);
  });

  after(async () => {
    // DONT CALL THIS. Will make additonal tests fail -->server.close();
  });

  it('Should get the message Hello', async () => {
    const response = await fetch(`${URL}/api/dummy`);
    const result = await response.json();
    expect(result.msg).to.be.equal('Hello');
  });

  it('Should get three users', async () => {
    const response = await fetch(`${URL}/api/users`);
    const result = await response.json();
    expect(result.length).to.be.equal(3);
  });

  it('Should Add the user Jan Olsen', async () => {
    const newUser = { name: 'Jan Olsen', userName: 'jo@b.dk', password: 'secret', role: 'user' };
    const config = {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newUser)
    };
    await fetch(`${URL}/api/users`, config);
    const jan = await usersCollection.findOne({ userName: 'jo@b.dk' });
    expect(jan).not.to.be.null;
    expect(jan.name).to.be.equal('Jan Olsen');
  });

  it('Should find the user Donald Duck', async () => {
    const response = await fetch(`${URL}/api/users/dd@b.dk`);
    const donald = await response.json();
    expect(donald.userName).to.be.equal('dd@b.dk');
  });

  it('Should not find the user xxx@b.dk', async () => {
    const status = await fetch(`${URL}/api/users/xxx@b.dk`);
    expect(status.status).to.be.equal(404);
  });

  it('Should Remove the user Donald Duck', async () => {
    const config = {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    };
    const response = await fetch(`${URL}/api/users/dd@b.dk`, config);
    const result = await response.json();
    expect(result.status).to.equal('User was deleted');
  });
});

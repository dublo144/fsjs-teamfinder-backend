import { expect } from 'chai';
import fetch from 'node-fetch';
import bcrypt from 'bcryptjs';
import UserModel from '../src/models/UserModel';

const debug = require('debug')('user-endpoint-test');

const TEST_PORT = '7777';

describe('####### Verify the User Endpoints (/api/users) ##########', function () {
  let URL: string;

  before(async function () {
    process.env.PORT = TEST_PORT;
    process.env.SKIP_AUTHENTICATION = 'true';
    process.env.MONGO_DB = 'semester_case_test';

    require('../src/app').server;
    URL = `http://localhost:${process.env.PORT}`;
  });

  beforeEach(async function () {
    await UserModel.remove({});
    const secretHashed = await bcrypt.hash('secret', 12);
    await UserModel.insertMany([
      { name: 'Peter Pan', userName: 'pp@b.dk', password: secretHashed, role: 'user' },
      { name: 'Donald Duck', userName: 'dd@b.dk', password: secretHashed, role: 'user' },
      { name: 'admin', userName: 'admin@a.dk', password: secretHashed, role: 'admin' }
    ]);
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
    const jan = await UserModel.findOne({ userName: 'jo@b.dk' });
    expect(jan).not.to.be.null;
  });

  it('Should find the user Donald Duck', async () => {
    const response = await fetch(`${URL}/api/users/dd@b.dk`);
    const donald = await response.json();
    expect(donald.userName).to.be.equal('dd@b.dk');
  });

  it('Should not find the user xxx@b.dk', async () => {
    const status = await fetch(`${URL}/api/users/xxx@b.dk`);
    expect(status.status).to.be.equal(500);
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
    const donald = await response.json();
    //expect(donald.userName).to.be.equal('dd@b.dk');
  });
});

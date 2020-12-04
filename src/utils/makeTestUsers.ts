// import * as mongo from 'mongodb';
// import bcrypt from 'bcryptjs';
// const debug = require('debug')('test-users');
// const MongoClient = mongo.MongoClient;
// import { USER_COLLECTION_NAME } from '../config/collectionNames';
// import { getConnectedClient, closeConnection } from '../config/setupDB';

// (async function makeTestData() {
//   try {
//     const client = await getConnectedClient();
//     const db = client.db(process.env.DB_NAME);

//     const usersCollection = db.collection(USER_COLLECTION_NAME);
//     await usersCollection.deleteMany({});
//     const secretHashed = await bcrypt.hash('secret', 12);
//     const status = await usersCollection.insertMany([
//       { name: 'Peter Pan', userName: 'pp@b.dk', password: secretHashed, role: 'user' },
//       { name: 'Donald Duck', userName: 'dd@b.dk', password: secretHashed, role: 'user' },
//       { name: 'admin', userName: 'admin@a.dk', password: secretHashed, role: 'admin' }
//     ]);
//     debug(`Inserted ${status.insertedCount} test users`);
//     debug(`NEVER, EVER run this on a production database`);
//   } catch (err) {
//     console.error(err);
//   } finally {
//     closeConnection();
//   }
// })();

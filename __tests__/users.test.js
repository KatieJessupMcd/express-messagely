process.env.NODE_ENV = 'test';
// npm packages
const request = require('supertest');
// app imports
const app = require('../app');
const db = require('../db');
const bcrypt = require('bcrypt');
const Message = require('../models/message');
const User = require('../models/user');

// const jwt = require("jsonwebtoken");
let auth = {};

beforeEach(async function() {
  const hashedPassword = await bcrypt.hash('secret', 1);
  await db.query(
    `INSERT INTO users (username, password, first_name, last_name, phone, join_at)
    VALUES ($1, $2, $3, $4, $5, $6)`,
    ['bob', hashedPassword, 'testFirstName', 'testLast', '12345', new Date()]
  );
  const newHash = await bcrypt.hash('supersecret', 1);
  await db.query(
    `INSERT INTO users (username, password, first_name, last_name, phone, join_at)
        VALUES ($1, $2, $3, $4, $5, $6)`,
    ['jim', newHash, 'james', 'patterson', '44444', new Date()]
  );
  await db.query(
    `INSERT INTO messages (from_username, to_username, body, sent_at)
        VALUES ($1, $2, $3, $4)`,
    ['jim', 'bob', 'hello', new Date()]
  );
  await db.query(
    `INSERT INTO messages (from_username, to_username, body, sent_at)
        VALUES ($1, $2, $3, $4)`,
    ['bob', 'jim', 'hello to you', new Date()]
  );
  const response = await request(app)
    .post('/auth/login')
    .send({
      username: 'bob',
      password: 'secret'
    });

  // we'll need the token for future requests
  auth.token = response.body.token;

  // we'll need the user_id for future requests
  auth.curr_user_id = 'bob';
});
// end

/** GET / - return  {users: {username, first_name, last_name, phone}, ...}
 * Requirements: ensureLoginRequired
 */

describe('GET /users', async function() {
  test("return 'we got the users'", async function() {
    const response = await request(app)
      .get('/users')
      .send({ _token: auth.token });
    expect(response.statusCode).toBe(200);
    expect(response.body.users[0].username).toEqual('bob');
    expect(response.body.users[0].join_at).not.toEqual(undefined);
    expect(response.body.users[0].first_name).toEqual('testFirstName');
    expect(response.body.users[0].last_name).toEqual('testLast');
    expect(response.body.users[0].phone).toEqual('12345');
  });
});

describe('GET /users/username', async function() {
  test("return 'we got the user'", async function() {
    const response = await request(app)
      .get('/users/bob')
      .send({ _token: auth.token });
    expect(response.statusCode).toBe(200);
    expect(response.body.user.username).toEqual('bob');
    expect(response.body.user.join_at).not.toEqual(undefined);
    expect(response.body.user.first_name).toEqual('testFirstName');
    expect(response.body.user.last_name).toEqual('testLast');
    expect(response.body.user.phone).toEqual('12345');
  });
});

describe('GET /users/username/to', async function() {
  test("return 'we got the messages to the user'", async function() {
    const response = await request(app)
      .get('/users/bob/to')
      .send({ _token: auth.token });
    console.log('RESPONSE', response.body);
    expect(response.statusCode).toBe(200);
    expect(response.body.hasOwnProperty('messages')).toEqual(true);
    // expect(response.body.user.join_at).not.toEqual(undefined);
    // expect(response.body.user.first_name).toEqual('testFirstName');
    // expect(response.body.user.last_name).toEqual('testLast');
    // expect(response.body.user.phone).toEqual('12345');
  });
});

afterEach(async function() {
  // delete any data created by test
  await db.query('DELETE FROM users');
});

afterEach(async function() {
  // delete any data created by test
  await db.query('DELETE FROM messages');
});

afterAll(async function() {
  // close db connection
  await db.end();
});

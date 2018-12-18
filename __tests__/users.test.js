process.env.NODE_ENV = 'test';
// npm packages
const request = require('supertest');
// app imports
const app = require('../app');
const db = require('../db');
const bcrypt = require('bcrypt');
// const jwt = require("jsonwebtoken");
let auth = {};

beforeEach(async function() {
  const hashedPassword = await bcrypt.hash('secret', 1);
  await db.query(
    `INSERT INTO users (username, password, first_name, last_name, phone, join_at)
        VALUES ($1, $2, $3, $4, $5, $6)`,
    ['test', hashedPassword, 'testFirstName', 'testLast', '12345', new Date()]
  );
  const response = await request(app)
    .post('/auth/login')
    .send({
      username: 'test',
      password: 'secret'
    });

  // we'll need the token for future requests
  auth.token = response.body.token;
  console.log(response.body);

  // we'll need the user_id for future requests
  auth.curr_user_id = 'test';
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
    expect(response.body).toEqual({
      users: {
        username: 'test',
        first_name: 'testFirstName',
        last_name: 'testLast',
        phone: '12345'
      }
    });
  });
});

afterEach(async function() {
  // delete any data created by test
  await db.query('DELETE FROM users');
});
afterAll(async function() {
  // close db connection
  await db.end();
});

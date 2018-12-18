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
    `INSERT INTO users (username, password)
        VALUES ('test', $1)`,
    [hashedPassword]
  );
  const response = await request(app)
    .post('/login')
    .send({
      username: 'test',
      password: 'secret'
    });

  // we'll need the token for future requests
  auth.token = response.body.token;

  // we'll need the user_id for future requests
  auth.curr_user_id = 'test';
});
// end

afterEach(async function() {
  // delete any data created by test
  await db.query('DELETE FROM users');
});

afterAll(async function() {
  // close db connection
  await db.end();
});

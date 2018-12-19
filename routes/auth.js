const express = require('express');
const router = new express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { SECRET_KEY, BCRYPT_WORK_ROUNDS } = require('../config.js');
const OPTIONS = { expiresIn: 60 * 60 }; // 1 hour
const User = require('../models/user');

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post('/login', async function(req, res, next) {
  try {
    const { username, password } = req.body;
    if (await User.authenticate(username, password)) {
      let token = jwt.sign({ username }, SECRET_KEY);
      await User.updateLoginTimestamp(username);
      return res.json({ token });
    }
    return next({ message: 'Invalid username/password' });
  } catch (error) {
    return next(error);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post('/register', async function(req, res, next) {
  console.log('trying2register');
  try {
    const { username, password, first_name, last_name, phone } = req.body;
    await User.register({ username, password, first_name, last_name, phone });
    await User.updateLoginTimestamp(username);
    let token = jwt.sign({ username }, SECRET_KEY);
    return res.json({ token });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

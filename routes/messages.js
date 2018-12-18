const express = require('express');
const router = new express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { SECRET_KEY, BCRYPT_WORK_ROUNDS } = require('../config.js');
const OPTIONS = { expiresIn: 60 * 60 }; // 1 hour
const Message = require('../models/message');
const User = require('../models/user');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get('/:id', ensureLoggedIn, async function(req, res, next) {
  try {
    const message = await Message.get(req.params.id);
    const { username } = req;
    const { from_user, to_user } = message;
    if (username === from_user.username || username === to_user.username) {
      return res.json({ message });
    }
    throw new Error('Invalid user');
  } catch (error) {
    next(error);
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post('/', ensureLoggedIn, async function(req, res, next) {
  try {
    const { to_username, body } = req.body;
    const from_username = req.username;
    const message = await Message.create({ from_username, to_username, body });
    return res.json({ message });
  } catch (error) {
    next(error);
  }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', ensureLoggedIn, async function(req, res, next) {
  try {
    const foundMessage = await Message.get(req.params.id);
    const { username } = req;
    if (foundMessage.to_user.username === username) {
      const message = await Message.markRead(req.params.id);
      return res.json({ message });
    }

    throw new Error('Not correct user');
  } catch (error) {
    next(error);
  }
});

module.exports = router;

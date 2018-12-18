/** User class for message.ly */
const express = require('express');
const router = new express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const { ensureLoggedIn, ensureCorrectUser } = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const { SECRET_KEY, BCRYPT_WORK_ROUNDS } = require('../config.js');
const OPTIONS = { expiresIn: 60 * 60 }; // 1 hour
/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  // WHAT DO THE {} WRAPPED AROUND PARAMETERS MEAN
  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_ROUNDS);
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING username, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]
    );
    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password FROM users WHERE username = $1`,
      [username]
    );
    const hashedPassword = result.rows[0].password;
    console.log('hashed password', hashedPassword);
    // DO WE NEED TO DO ANYTHING WITH JWTS HERE???
    if (password.length != 0) {
      if (await bcrypt.compare(password, hashedPassword)) {
        return true;
      }
    }
    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users SET last_login_at = current_timestamp WHERE username = $1`,
      [username]
    );
    // ACTUALLY RETURN ANYTHING???
    return result.rows[0];
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users`
    );
    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users WHERE username = $1`,
      [username]
    );
    if (result.rows.length === 0) {
      throw new Error('No such user exists');
    }
    return result.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  // DOES RETURN VALUE NEED TO BE WRAPPED IN ARRAY???
  // IS RETURN VAL JSON???
  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT id, to_user, body, sent_at, read_at FROM messages WHERE from_username = $1`,
      [username]
    );
    if (result.rows.length === 0) {
      throw new Error('No messages from this user');
    }
    return result.rows;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT id, from_user, body, sent_at, read_at FROM messages WHERE to_username = $1`,
      [username]
    );
    if (result.rows.length === 0) {
      throw new Error('No messages to this user');
    }
    return result.rows;
  }
}

module.exports = User;

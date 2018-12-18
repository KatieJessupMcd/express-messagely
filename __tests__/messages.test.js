process.env.NODE_ENV = 'test';
// npm packages
const request = require('supertest');

// app imports
const app = require('../app');
const db = require('../db');
const bcrypt = require('bcrypt');
// const jwt = require("jsonwebtoken");

let auth = {};

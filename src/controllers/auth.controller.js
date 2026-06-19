const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  // basic register
  res.json({ message: 'Registered' });
};

exports.login = async (req, res) => {
  // basic login
  res.json({ message: 'Logged in' });
};

exports.googleLogin = async (req, res) => { res.json({ message: 'Google OAuth via BetterAuth mock' }); };

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Register a new Administrator
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const cleanUser = username.trim().toLowerCase();
    const existing = await Admin.findOne({ username: cleanUser });
    if (existing) {
      return res.status(400).json({ error: 'Administrator username already exists' });
    }
    const newAdmin = new Admin({ username: cleanUser, passwordHash: password });
    await newAdmin.save();
    return res.status(201).json({ message: 'Admin account registered successfully', username: cleanUser });
  } catch (err) {
    return res.status(500).json({ error: 'Server error while registering admin' });
  }
});

// Admin Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const userClean = (username || '').trim().toLowerCase();

  // 1. Check default credentials
  if (
    (userClean === 'admin' && password === 'letsgo2026') ||
    (userClean === 'moratuwa' && password === 'moratuwa2026')
  ) {
    const token = jwt.sign({ username: userClean, role: 'admin' }, process.env.JWT_SECRET || 'letsgo_jwt_secret', { expiresIn: '24h' });
    return res.json({ message: 'Admin authenticated successfully', token, username: userClean });
  }

  // 2. Check Database registered admins
  try {
    const admin = await Admin.findOne({ username: userClean });
    if (admin && (await admin.comparePassword(password))) {
      const token = jwt.sign({ username: userClean, role: 'admin' }, process.env.JWT_SECRET || 'letsgo_jwt_secret', { expiresIn: '24h' });
      return res.json({ message: 'Admin authenticated successfully', token, username: userClean });
    }
  } catch (err) {}

  return res.status(401).json({ error: 'Invalid administrator credentials' });
});

module.exports = router;

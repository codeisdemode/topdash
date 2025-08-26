const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../utils/sqlite');

const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, tenant_name } = req.body;

    if (!email || !password || !name || !tenant_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create tenant
    const tenantResult = await query(
      'INSERT INTO tenants (name, plan) VALUES ($1, $2) RETURNING id',
      [tenant_name, 'free']
    );
    // For INSERT queries, we get { rowCount, lastID }
    if (!tenantResult.lastID) {
      return res.status(500).json({ error: 'Failed to create tenant' });
    }
    const tenantId = tenantResult.lastID;

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userResult = await query(
      'INSERT INTO users (tenant_id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role, name',
      [tenantId, email, passwordHash, 'admin', name]
    );

    // For INSERT...RETURNING queries, we need to handle the result format
    let user;
    if (userResult.rows && userResult.rows.length > 0) {
      user = userResult.rows[0];
    } else {
      // If we don't get rows back, create a minimal user object
      user = {
        id: userResult.lastID,
        email: email,
        role: 'admin',
        name: name
      };
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, tenantId: tenantId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant_id: tenantId
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const userResult = await query(
      'SELECT u.*, t.name as tenant_name, t.plan as tenant_plan FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE u.email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant_id: user.tenant_id,
        tenant_name: user.tenant_name,
        tenant_plan: user.tenant_plan
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
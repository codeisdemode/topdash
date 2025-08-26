const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../utils/sqlite');

const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
  try {
    console.log('FIXED: Register endpoint called');
    const { email, password, name, tenant_name } = req.body;
    console.log('FIXED: Request body:', { email, name, tenant_name });

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
    
    console.log('FIXED: Tenant result:', JSON.stringify(tenantResult));
    console.log('FIXED: Tenant result keys:', Object.keys(tenantResult));
    
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
      'INSERT INTO users (tenant_id, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email, role',
      [tenantId, email, passwordHash, 'admin']
    );

    console.log('FIXED: User result:', JSON.stringify(userResult));
    
    // For INSERT queries, we get { rowCount, lastID }
    if (!userResult.lastID) {
      return res.status(500).json({ error: 'Failed to create user' });
    }
    
    // Create user object from the result
    const user = {
      id: userResult.lastID,
      email: email,
      role: 'admin',
      name: name
    };
    
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
    console.error('FIXED: Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
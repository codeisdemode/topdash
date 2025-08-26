const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../utils/sqlite');

const router = express.Router();

// Simple test endpoint
router.post('/test-register', async (req, res) => {
  try {
    const { email, password, name, tenant_name } = req.body;

    console.log('Test registration called with:', { email, name, tenant_name });
    
    // Create tenant
    const tenantResult = await query(
      'INSERT INTO tenants (name, plan) VALUES ($1, $2) RETURNING id',
      [tenant_name, 'free']
    );
    
    console.log('Tenant result:', JSON.stringify(tenantResult));
    
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

    console.log('User result:', JSON.stringify(userResult));
    
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
    console.error('Test registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
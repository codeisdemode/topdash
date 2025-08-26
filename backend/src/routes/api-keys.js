const express = require('express');
const bcrypt = require('bcrypt');
const { query } = require('../utils/sqlite');
const { authenticateToken, authenticateApiKey, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Generate a random API key
function generateApiKey() {
  const crypto = require('crypto');
  return 'api_' + crypto.randomBytes(24).toString('hex');
}

// Get all API keys for current tenant
router.get('/', authenticateApiKey, requireAdmin, async (req, res) => {
  try {
    const apiKeysResult = await query(
      `SELECT 
         ak.id, ak.name, ak.key_hash, ak.last_used, ak.created_at, ak.expires_at, ak.revoked,
         u.email as user_email
       FROM api_keys ak
       LEFT JOIN users u ON ak.user_id = u.id
       WHERE ak.tenant_id = ?
       ORDER BY ak.created_at DESC`,
      [req.user.tenant_id]
    );

    // Don't return the actual key hashes for security
    const apiKeys = apiKeysResult.rows.map(key => ({
      id: key.id,
      name: key.name,
      last_used: key.last_used,
      created_at: key.created_at,
      expires_at: key.expires_at,
      revoked: key.revoked,
      user_email: key.user_email
    }));

    res.json(apiKeys);
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new API key
router.post('/', authenticateApiKey, requireAdmin, async (req, res) => {
  try {
    const { name, expires_in_days = 365 } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Generate API key
    const apiKey = generateApiKey();
    const keyHash = await bcrypt.hash(apiKey, 10);

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expires_in_days));

    const insertResult = await query(
      'INSERT INTO api_keys (tenant_id, user_id, name, key_hash, expires_at) VALUES (?, ?, ?, ?, ?)',
      [req.user.tenant_id, req.user.id, name, keyHash, expiresAt.toISOString()]
    );

    res.status(201).json({
      message: 'API key created successfully',
      api_key: apiKey, // Only returned once!
      key_info: {
        id: insertResult.lastID,
        name: name,
        expires_at: expiresAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Revoke API key
router.delete('/:id', authenticateApiKey, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const updateResult = await query(
      'UPDATE api_keys SET revoked = TRUE WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({ message: 'API key revoked successfully' });
  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
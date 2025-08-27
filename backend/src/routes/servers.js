const express = require('express');
const { query } = require('../utils/sqlite');
const { authenticateToken, requireViewer, authenticateApiKey } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Get all servers for current tenant
router.get('/', (req, res, next) => {
  // Try API key first, then JWT token
  const authHeader = req.headers['authorization'];
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // Check if it's an API key (starts with api_ or is our dev key)
    if (token.startsWith('api_') || token === 'dev-api-key-1234567890') {
      return authenticateApiKey(req, res, next);
    } else {
      return authenticateToken(req, res, next);
    }
  } else {
    return authenticateToken(req, res, next);
  }
}, requireViewer, async (req, res) => {
  try {
    const serversResult = await query(
      `SELECT 
         s.*,
         (SELECT json_object(
           'cpu_usage', m.cpu_usage,
           'memory_usage', m.memory_usage,
           'disk_usage', m.disk_usage,
           'timestamp', m.time
         ) 
         FROM metrics m 
         WHERE m.server_id = s.id 
         ORDER BY m.time DESC 
         LIMIT 1) as last_metrics
       FROM servers s 
       WHERE s.tenant_id = ? 
       ORDER BY s.created_at DESC`,
      [req.user.tenant_id]
    );

    res.json(serversResult.rows);
  } catch (error) {
    console.error('Get servers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific server details
router.get('/:id', authenticateToken, requireViewer, async (req, res) => {
  try {
    const { id } = req.params;

    const serverResult = await query(
      `SELECT s.*, 
         (SELECT json_group_array(
           json_object(
             'time', m.time,
             'cpu_usage', m.cpu_usage,
             'memory_usage', m.memory_usage,
             'disk_usage', m.disk_usage,
             'network_in', m.network_in,
             'network_out', m.network_out
           )
         ) 
         FROM metrics m 
         WHERE m.server_id = s.id 
         AND m.time > datetime('now', '-24 hours')
         ORDER BY m.time DESC) as metrics
       FROM servers s 
       WHERE s.id = ? AND s.tenant_id = ?`,
      [id, req.user.tenant_id]
    );

    if (serverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    res.json(serverResult.rows[0]);
  } catch (error) {
    console.error('Get server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register new server (accepts both JWT tokens and API keys)
router.post('/register', (req, res, next) => {
  // Try API key first, then JWT token
  const authHeader = req.headers['authorization'];
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // Check if it's an API key (starts with api_ or is our dev key)
    if (token.startsWith('api_') || token === 'dev-api-key-1234567890') {
      return authenticateApiKey(req, res, next);
    } else {
      return authenticateToken(req, res, next);
    }
  } else {
    return authenticateToken(req, res, next);
  }
}, async (req, res) => {
  try {
    const { name, ip, site, ubuntu_version } = req.body;

    if (!name || !ip) {
      return res.status(400).json({ error: 'Name and IP are required' });
    }

    // Generate agent token
    const crypto = require('crypto');
    const bcrypt = require('bcrypt');
    const agentToken = crypto.randomBytes(32).toString('hex');
    const agentTokenHash = await bcrypt.hash(agentToken, 12);

    const serverResult = await query(
      'INSERT INTO servers (tenant_id, name, ip_address, ip, site, ubuntu_version, agent_token) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.tenant_id, name, ip, ip, site, ubuntu_version, agentTokenHash]
    );

    // Get the inserted server
    const server = await query(
      'SELECT * FROM servers WHERE id = ?',
      [serverResult.lastID]
    );

    res.status(201).json({
      message: 'Server registered successfully',
      server: {
        id: serverResult.lastID,
        name: name,
        ip: ip,
        agent_token: agentToken
      }
    });

  } catch (error) {
    console.error('Register server error details:', error.message, error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Delete server (accepts both JWT tokens and API keys)
router.delete('/:id', (req, res, next) => {
  // Try API key first, then JWT token
  const authHeader = req.headers['authorization'];
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // Check if it's an API key (starts with api_ or is our dev key)
    if (token.startsWith('api_') || token === 'dev-api-key-1234567890') {
      return authenticateApiKey(req, res, next);
    } else {
      return authenticateToken(req, res, next);
    }
  } else {
    return authenticateToken(req, res, next);
  }
}, async (req, res) => {
  try {
    const { id } = req.params;

    const deleteResult = await query(
      'DELETE FROM servers WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    res.json({ message: 'Server deleted successfully' });
  } catch (error) {
    console.error('Delete server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Agent installation script endpoint (public access)
router.get('/agent-install', (req, res) => {
  try {
    const scriptPath = path.join(__dirname, '../../scripts/agent-install.sh');
    
    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({ error: 'Installation script not found' });
    }
    
    const scriptContent = fs.readFileSync(scriptPath, 'utf8');
    
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'inline');
    res.send(scriptContent);
  } catch (error) {
    console.error('Agent install script error:', error);
    res.status(500).json({ error: 'Failed to load installation script' });
  }
});

module.exports = router;
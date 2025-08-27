const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

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

// Agent binary endpoint (public access)
router.get('/agent-binary', (req, res) => {
  try {
    const binaryPath = path.join(__dirname, '../../../agent/monitoring-agent');
    
    if (!fs.existsSync(binaryPath)) {
      return res.status(404).json({ error: 'Agent binary not found' });
    }
    
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="monitoring-agent"');
    res.sendFile(path.resolve(binaryPath));
  } catch (error) {
    console.error('Agent binary download error:', error);
    res.status(500).json({ error: 'Failed to download agent binary' });
  }
});

// Health check endpoint (public)
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Agent update check endpoint (requires agent authentication)
router.get('/agent/update-check', async (req, res) => {
  try {
    const agentToken = req.headers['x-agent-token'];
    const serverId = req.headers['x-server-id'];
    const agentVersion = req.headers['x-agent-version'];
    
    if (!agentToken || !serverId) {
      return res.status(401).json({ error: 'Agent token and server ID required' });
    }
    
    // Verify agent token (simplified - in production, use proper auth)
    const { query } = require('../utils/sqlite');
    const bcrypt = require('bcrypt');
    
    const serverResult = await query(
      'SELECT id, tenant_id, name, agent_token FROM servers WHERE id = ?',
      [serverId]
    );
    
    if (serverResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid server ID' });
    }
    
    const server = serverResult.rows[0];
    const isValidToken = await bcrypt.compare(agentToken, server.agent_token);
    
    if (!isValidToken) {
      return res.status(401).json({ error: 'Invalid agent token' });
    }
    
    // Check if update is available
    const latestVersion = '1.1.0'; // This should be dynamic in production
    const updateAvailable = agentVersion !== latestVersion;
    
    res.json({
      update_available: updateAvailable,
      latest_version: latestVersion,
      download_url: updateAvailable ? `${req.protocol}://${req.get('host')}/api/v1/public/agent-binary` : null,
      checksum: updateAvailable ? 'a69dbed2dd40cc32779191afa7ec793bf8ecafcea15db4210fecad07c989da9c' : null
    });
    
  } catch (error) {
    console.error('Update check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
const jwt = require('jsonwebtoken');
const { query } = require('../utils/sqlite');

// Verify JWT token and attach user to request
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists and get tenant info
    const userResult = await query(
      'SELECT u.*, t.name as tenant_name, t.plan as tenant_plan FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE u.id = ?',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Verify agent token - per-agent authentication
async function authenticateAgent(req, res, next) {
  const token = req.headers['x-agent-token'];
  const serverId = req.body.server_id;

  console.log('Agent auth attempt:', { 
    hasToken: !!token, 
    hasServerId: !!serverId,
    serverId: serverId,
    tokenLength: token ? token.length : 0
  });

  if (!token || !serverId) {
    return res.status(401).json({ error: 'Agent token and server ID required' });
  }

  try {
    // Get server with agent token hash
    const serverResult = await query(
      'SELECT id, tenant_id, name, agent_token FROM servers WHERE id = ?',
      [serverId]
    );

    if (serverResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid agent token or server ID' });
    }

    const server = serverResult.rows[0];
    const bcrypt = require('bcrypt');
    
    // Verify token against stored hash
    const isValidToken = await bcrypt.compare(token, server.agent_token);
    if (!isValidToken) {
      return res.status(401).json({ error: 'Invalid agent token or server ID' });
    }

    req.server = server;
    next();
  } catch (error) {
    console.error('Agent authentication error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Verify API key
async function authenticateApiKey(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    // Validate API key against database
    const bcrypt = require('bcrypt');
    
    // Get all active API keys for comparison
    const apiKeysResult = await query(
      `SELECT ak.*, u.email, u.role, t.name as tenant_name, t.plan as tenant_plan 
       FROM api_keys ak 
       JOIN tenants t ON ak.tenant_id = t.id 
       LEFT JOIN users u ON ak.user_id = u.id 
       WHERE ak.revoked = FALSE AND (ak.expires_at IS NULL OR ak.expires_at > datetime('now'))`
    );
    
    let validKey = null;
    for (const key of apiKeysResult.rows) {
      if (await bcrypt.compare(apiKey, key.key_hash)) {
        validKey = key;
        break;
      }
    }
    
    if (!validKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    // Update last used timestamp
    await query(
      'UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE id = ?',
      [validKey.id]
    );
    
    // Set user context
    req.user = {
      id: validKey.user_id || 0,
      email: validKey.email || 'api@example.com',
      role: validKey.role || 'admin',
      tenant_id: validKey.tenant_id,
      tenant_name: validKey.tenant_name,
      tenant_plan: validKey.tenant_plan
    };
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    return res.status(403).json({ error: 'Invalid API key' });
  }
}

// Check if user has admin role
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Check if user has at least viewer role
function requireViewer(req, res, next) {
  if (!['admin', 'viewer'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
}

module.exports = {
  authenticateToken,
  authenticateAgent,
  authenticateApiKey,
  requireAdmin,
  requireViewer
};
const express = require('express');
const { query } = require('../utils/sqlite');
const { authenticateToken, requireViewer, authenticateApiKey } = require('../middleware/auth');

const router = express.Router();

// Get all alerts for current tenant
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
    const { resolved } = req.query;
    
    let queryText = `
      SELECT a.*, s.name as server_name
      FROM alerts a
      LEFT JOIN servers s ON a.server_id = s.id
      WHERE a.tenant_id = ?
    `;
    
    const queryParams = [req.user.tenant_id];
    
    if (resolved !== undefined) {
      queryText += ' AND a.resolved = ?';
      queryParams.push(resolved === 'true');
    }
    
    queryText += ' ORDER BY a.created_at DESC LIMIT 100';
    
    const alertsResult = await query(queryText, queryParams);
    
    res.json(alertsResult.rows);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get alert statistics
router.get('/stats', (req, res, next) => {
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
    const statsResult = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN NOT resolved THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warning
      FROM alerts 
      WHERE tenant_id = ?
    `, [req.user.tenant_id]);
    
    res.json(statsResult.rows[0]);
  } catch (error) {
    console.error('Get alert stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark alert as resolved
router.patch('/:id/resolve', (req, res, next) => {
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
    
    const updateResult = await query(
      `UPDATE alerts 
       SET resolved = TRUE, resolved_at = datetime('now') 
       WHERE id = ? AND tenant_id = ?`,
      [id, req.user.tenant_id]
    );
    
    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    // Get the updated alert
    const alertResult = await query(
      'SELECT * FROM alerts WHERE id = ?',
      [id]
    );
    
    res.json({ 
      message: 'Alert resolved successfully',
      alert: alertResult.rows[0] 
    });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete alert
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
      'DELETE FROM alerts WHERE id = ? AND tenant_id = ?',
      [id, req.user.tenant_id]
    );
    
    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
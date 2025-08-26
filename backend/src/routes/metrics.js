const express = require('express');
const rateLimit = require('express-rate-limit');
const { query } = require('../utils/sqlite');
const { authenticateAgent } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for agent metrics - 60 requests per minute per IP
const agentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute
  message: { error: 'Too many requests from this agent, please try again later' },
  skip: (req) => {
    // Skip rate limiting for internal/health checks
    return req.ip === '127.0.0.1' || req.ip === '::1';
  }
});

// Receive metrics from agent
router.post('/', agentLimiter, authenticateAgent, async (req, res) => {
  try {
    const { server_id, cpu_usage, memory_usage, disk_usage, network_in, network_out, os_version, site_status } = req.body;

    if (!server_id) {
      return res.status(400).json({ error: 'Server ID is required' });
    }

    // Verify server exists and get tenant ID for alerting
    const serverResult = await query(
      'SELECT id, tenant_id, name FROM servers WHERE id = ?',
      [server_id]
    );

    if (serverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Server not found' });
    }

    const server = serverResult.rows[0];

    // Insert metrics
    await query(
      `INSERT INTO metrics 
       (server_id, cpu_usage, memory_usage, disk_usage, network_in, network_out, os_version, site_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [server_id, cpu_usage, memory_usage, disk_usage, network_in, network_out, os_version, site_status]
    );

    // Check for alerts
    await checkAlerts(server, { cpu_usage, memory_usage, disk_usage, site_status });

    res.json({ message: 'Metrics received successfully' });

  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get metrics for a server
router.get('/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { hours = 24 } = req.query;

    const metricsResult = await query(
      `SELECT 
         time,
         cpu_usage,
         memory_usage,
         disk_usage,
         network_in,
         network_out,
         site_status
       FROM metrics 
       WHERE server_id = ? 
       AND time > datetime('now', ?)
       ORDER BY time DESC
       LIMIT 1000`,
      [serverId, `-${hours} hours`]
    );

    res.json(metricsResult.rows);
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Alert checking function
async function checkAlerts(server, metrics) {
  const alerts = [];

  // CPU alert
  if (metrics.cpu_usage > 80) {
    alerts.push({
      tenant_id: server.tenant_id,
      server_id: server.id,
      type: 'high_cpu',
      message: `High CPU usage on ${server.name}: ${metrics.cpu_usage}%`,
      severity: 'warning'
    });
  }

  // Memory alert
  if (metrics.memory_usage > 85) {
    alerts.push({
      tenant_id: server.tenant_id,
      server_id: server.id,
      type: 'high_memory',
      message: `High memory usage on ${server.name}: ${metrics.memory_usage}%`,
      severity: 'warning'
    });
  }

  // Disk alert
  if (metrics.disk_usage > 90) {
    alerts.push({
      tenant_id: server.tenant_id,
      server_id: server.id,
      type: 'high_disk',
      message: `High disk usage on ${server.name}: ${metrics.disk_usage}%`,
      severity: 'critical'
    });
  }

  // Site down alert
  if (metrics.site_status && metrics.site_status >= 400) {
    alerts.push({
      tenant_id: server.tenant_id,
      server_id: server.id,
      type: 'site_down',
      message: `Site down on ${server.name}: HTTP ${metrics.site_status}`,
      severity: 'critical'
    });
  }

  // Insert alerts if any
  if (alerts.length > 0) {
    for (const alert of alerts) {
      try {
        await query(
          'INSERT INTO alerts (tenant_id, server_id, type, message, severity) VALUES (?, ?, ?, ?, ?)',
          [alert.tenant_id, alert.server_id, alert.type, alert.message, alert.severity]
        );
      } catch (error) {
        console.log('Alert insertion error:', error);
      }
    }
    
    // TODO: Send notifications via webhooks/email
    console.log('Alerts triggered:', alerts);
  }
}

module.exports = router;
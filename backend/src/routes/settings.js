const express = require('express');
const { query } = require('../utils/sqlite');
const { authenticateToken, authenticateApiKey, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get settings for current tenant
router.get('/', authenticateApiKey, async (req, res) => {
  try {
    const settingsResult = await query(
      `SELECT 
         email_notifications, email_address,
         telegram_notifications, telegram_bot_token, telegram_chat_id,
         alert_thresholds
       FROM tenant_settings 
       WHERE tenant_id = ?`,
      [req.user.tenant_id]
    );

    if (settingsResult.rows.length === 0) {
      // Return default settings if none exist
      return res.json({
        email_notifications: false,
        email_address: '',
        telegram_notifications: false,
        telegram_bot_token: '',
        telegram_chat_id: '',
        alert_thresholds: {
          cpu: 80,
          memory: 85,
          disk: 90,
          site_status: 400
        }
      });
    }

    const settings = settingsResult.rows[0];
    
    // Parse alert_thresholds if it's stored as JSON string
    if (typeof settings.alert_thresholds === 'string') {
      settings.alert_thresholds = JSON.parse(settings.alert_thresholds);
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update settings for current tenant
router.put('/', authenticateApiKey, requireAdmin, async (req, res) => {
  try {
    const {
      email_notifications,
      email_address,
      telegram_notifications,
      telegram_bot_token,
      telegram_chat_id,
      alert_thresholds
    } = req.body;

    // Validate alert thresholds
    if (alert_thresholds) {
      const { cpu, memory, disk, site_status } = alert_thresholds;
      if (cpu < 1 || cpu > 100 || memory < 1 || memory > 100 || disk < 1 || disk > 100 || site_status < 100 || site_status > 599) {
        return res.status(400).json({ error: 'Invalid threshold values' });
      }
    }

    // Check if settings already exist
    const existingResult = await query(
      'SELECT id FROM tenant_settings WHERE tenant_id = ?',
      [req.user.tenant_id]
    );

    if (existingResult.rows.length > 0) {
      // Update existing settings
      await query(
        `UPDATE tenant_settings SET
         email_notifications = ?, email_address = ?,
         telegram_notifications = ?, telegram_bot_token = ?, telegram_chat_id = ?,
         alert_thresholds = ?, updated_at = datetime('now')
         WHERE tenant_id = ?`,
        [
          email_notifications,
          email_address,
          telegram_notifications,
          telegram_bot_token,
          telegram_chat_id,
          JSON.stringify(alert_thresholds),
          req.user.tenant_id
        ]
      );
    } else {
      // Insert new settings
      await query(
        `INSERT INTO tenant_settings 
         (tenant_id, email_notifications, email_address, 
          telegram_notifications, telegram_bot_token, telegram_chat_id,
          alert_thresholds)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.tenant_id,
          email_notifications,
          email_address,
          telegram_notifications,
          telegram_bot_token,
          telegram_chat_id,
          JSON.stringify(alert_thresholds)
        ]
      );
    }

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
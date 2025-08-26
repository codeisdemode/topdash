const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../server_monitoring.db');

// Create SQLite database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
    
    // Create tables if they don't exist
    initializeDatabase();
  }
});

// Initialize database with schema
function initializeDatabase() {
  const schema = `
    -- Tenants table
    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL DEFAULT 1,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- Servers table
    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL,
      hostname TEXT,
      ip_address TEXT NOT NULL,
      ip TEXT NOT NULL,
      site TEXT,
      ubuntu_version TEXT,
      agent_token TEXT NOT NULL,
      status TEXT DEFAULT 'offline',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    -- Metrics table
    CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id INTEGER NOT NULL,
      time DATETIME DEFAULT CURRENT_TIMESTAMP,
      cpu_usage REAL,
      memory_usage REAL,
      disk_usage REAL,
      network_in REAL,
      network_out REAL,
      os_version TEXT,
      site_status INTEGER,
      FOREIGN KEY (server_id) REFERENCES servers (id) ON DELETE CASCADE
    );

    -- Alerts table
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL DEFAULT 1,
      server_id INTEGER,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'warning',
      resolved BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (server_id) REFERENCES servers (id) ON DELETE SET NULL
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_metrics_server_id ON metrics(server_id);
    CREATE INDEX IF NOT EXISTS idx_metrics_time ON metrics(time);
    CREATE INDEX IF NOT EXISTS idx_alerts_server_id ON alerts(server_id);
    CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
    CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
    
    -- API keys table
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL DEFAULT 1,
      user_id INTEGER,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      last_used DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      revoked BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Tenant settings table
    CREATE TABLE IF NOT EXISTS tenant_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL UNIQUE,
      email_notifications BOOLEAN DEFAULT FALSE,
      email_address TEXT,
      telegram_notifications BOOLEAN DEFAULT FALSE,
      telegram_bot_token TEXT,
      telegram_chat_id TEXT,
      alert_thresholds TEXT DEFAULT '{"cpu":80,"memory":85,"disk":90,"site_status":400}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );
    
    -- Indexes for API keys
    CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
    CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON api_keys(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
  `;

  // Execute schema creation
  db.exec(schema, (err) => {
    if (err) {
      console.error('Error creating database schema:', err.message);
    } else {
      console.log('Database schema initialized successfully');
      
      // Insert only essential data (tenant and default user) if tables are empty
      insertEssentialData();
    }
  });
}

// Insert only essential data (tenant and default user)
function insertEssentialData() {
  // Check if tenants table is empty
  db.get('SELECT COUNT(*) as count FROM tenants', (err, row) => {
    if (err) {
      console.error('Error checking tenants table:', err.message);
      return;
    }
    
    if (row.count === 0) {
      console.log('Creating default tenant and user...');
      
      // Insert default tenant
      db.run(`INSERT INTO tenants (name, plan) VALUES ('Demo Tenant', 'free')`, function(err) {
        if (err) {
          console.error('Error inserting tenant:', err.message);
          return;
        }
        
        const tenantId = this.lastID;
        
        // Insert default user
        const bcrypt = require('bcrypt');
        const passwordHash = bcrypt.hashSync('password123', 10);
        
        db.run(`INSERT INTO users (tenant_id, email, password_hash, role) VALUES (?, ?, ?, ?)`,
          [tenantId, 'admin@example.com', passwordHash, 'admin'], function(err) {
          if (err) {
            console.error('Error inserting user:', err.message);
          } else {
            console.log('Default tenant and user created successfully');
          }
        });
      });
    }
  });
}

// Helper function for queries with promises
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      db.all(sql, params, (err, rows) => {
        const duration = Date.now() - start;
        if (err) {
          console.error('Query error:', { sql, params, error: err.message });
          reject(err);
        } else {
          console.log('Executed query', { sql, duration, rows: rows.length });
          resolve({ rows });
        }
      });
    } else {
      db.run(sql, params, function(err) {
        const duration = Date.now() - start;
        if (err) {
          console.error('Query error:', { sql, params, error: err.message });
          reject(err);
        } else {
          console.log('Executed query', { sql, duration, changes: this.changes });
          resolve({ rowCount: this.changes, lastID: this.lastID });
        }
      });
    }
  });
}

// Helper function for single row queries
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('Get error:', { sql, params, error: err.message });
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

module.exports = {
  db,
  query,
  get
};
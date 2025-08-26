-- Server Monitoring Database Schema for SQLite
-- Create tables for servers, metrics, and alerts

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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    FOREIGN KEY (server_id) REFERENCES servers (id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_metrics_server_id ON metrics(server_id);
CREATE INDEX IF NOT EXISTS idx_metrics_time ON metrics(time);
CREATE INDEX IF NOT EXISTS idx_alerts_server_id ON alerts(server_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

-- Insert initial mock data for development
INSERT INTO servers (name, hostname, ip_address, ip, agent_token, status) VALUES
('Production Web Server', 'web-01.prod.example.com', '192.168.1.100', '192.168.1.100', 'mock-token-1', 'online'),
('Database Server', 'db-01.prod.example.com', '192.168.1.101', '192.168.1.101', 'mock-token-2', 'online'),
('Backup Server', 'backup-01.prod.example.com', '192.168.1.102', '192.168.1.102', 'mock-token-3', 'offline');

-- Insert some initial metrics
INSERT INTO metrics (server_id, cpu_usage, memory_usage, disk_usage, network_in, network_out, os_version, site_status) VALUES
(1, 45.2, 78.1, 32.4, 120.5, 85.3, 'Ubuntu 22.04', 200),
(2, 23.8, 65.3, 45.1, 95.7, 62.1, 'Ubuntu 22.04', 200),
(1, 42.1, 76.8, 33.2, 118.9, 83.7, 'Ubuntu 22.04', 200),
(2, 25.3, 67.2, 46.8, 97.3, 64.5, 'Ubuntu 22.04', 200);
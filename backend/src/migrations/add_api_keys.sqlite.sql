-- Add API keys table for SQLite
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

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- Insert a sample API key for development (key: dev-api-key-1234567890)
INSERT INTO api_keys (tenant_id, name, key_hash, expires_at) 
SELECT 
    1, 
    'Development API Key', 
    '$2b$10$8K1p/a0dR1C3eF3n2K1JVe3cKJZJ8K1p/a0dR1C3eF3n2K1JVe3cKJZJ8K1p',
    datetime('now', '+1 year')
WHERE NOT EXISTS (SELECT 1 FROM api_keys WHERE name = 'Development API Key');

-- Add comment for documentation
INSERT INTO sqlite_master (type, name, tbl_name, sql) 
SELECT 'table', 'api_keys', 'api_keys', 'API keys for programmatic access to the TopDash API'
WHERE NOT EXISTS (SELECT 1 FROM sqlite_master WHERE name = 'api_keys');
-- Add API keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    revoked BOOLEAN DEFAULT FALSE
);

-- Index for faster lookups
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

-- Add API key authentication middleware support
COMMENT ON TABLE api_keys IS 'API keys for programmatic access to the TopDash API';

-- Insert a sample API key for development (key: dev-api-key-1234567890)
INSERT INTO api_keys (tenant_id, name, key_hash, expires_at) 
VALUES (
    (SELECT id FROM tenants LIMIT 1), 
    'Development API Key', 
    '$2b$10$8K1p/a0dR1C3eF3n2K1JVe3cKJZJ8K1p/a0dR1C3eF3n2K1JVe3cKJZJ8K1p',
    NOW() + INTERVAL '1 year'
);
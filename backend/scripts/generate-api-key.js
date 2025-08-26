const bcrypt = require('bcrypt');
const { query } = require('../src/utils/sqlite');

async function generateApiKey() {
  const crypto = require('crypto');
  return 'api_' + crypto.randomBytes(24).toString('hex');
}

async function createApiKey(name, tenantId = 1, userId = null, expiresInDays = 365) {
  try {
    const apiKey = await generateApiKey();
    const keyHash = await bcrypt.hash(apiKey, 10);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    const result = await query(
      'INSERT INTO api_keys (tenant_id, user_id, name, key_hash, expires_at) VALUES (?, ?, ?, ?, ?)',
      [tenantId, userId, name, keyHash, expiresAt.toISOString()]
    );
    
    console.log('API Key created successfully:');
    console.log('Name:', name);
    console.log('API Key:', apiKey);
    console.log('Expires:', expiresAt.toISOString().split('T')[0]);
    console.log('ID:', result.lastID);
    console.log('\nIMPORTANT: Save this API key now - it will only be shown once!');
    
    return { apiKey, keyId: result.lastID };
  } catch (error) {
    console.error('Error creating API key:', error);
    throw error;
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log('Usage: node generate-api-key.js "Key Name" [tenant_id] [user_id] [expires_in_days]');
    console.log('Example: node generate-api-key.js "Production API Key" 1 1 365');
    process.exit(0);
  }
  
  const name = args[0];
  const tenantId = args[1] ? parseInt(args[1]) : 1;
  const userId = args[2] ? parseInt(args[2]) : null;
  const expiresInDays = args[3] ? parseInt(args[3]) : 365;
  
  createApiKey(name, tenantId, userId, expiresInDays)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { generateApiKey, createApiKey };
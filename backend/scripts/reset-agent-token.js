const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { query } = require('../src/utils/sqlite');

async function resetAgentToken(serverId) {
  try {
    // Generate new agent token
    const agentToken = crypto.randomBytes(32).toString('hex');
    const agentTokenHash = await bcrypt.hash(agentToken, 12);

    // Update the server with new agent token
    const result = await query(
      'UPDATE servers SET agent_token = ? WHERE id = ?',
      [agentTokenHash, serverId]
    );

    if (result.rowCount === 0) {
      console.error('Server not found');
      return null;
    }

    console.log('Agent token reset successfully:');
    console.log('Server ID:', serverId);
    console.log('Agent Token:', agentToken);
    console.log('\nIMPORTANT: Save this agent token now - it will only be shown once!');

    return agentToken;
  } catch (error) {
    console.error('Error resetting agent token:', error);
    throw error;
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log('Usage: node reset-agent-token.js <server_id>');
    console.log('Example: node reset-agent-token.js 4');
    process.exit(0);
  }
  
  const serverId = parseInt(args[0]);
  
  resetAgentToken(serverId)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { resetAgentToken };
const fs = require('fs');
const crypto = require('crypto');

function generateChecksum(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

const agentPath = '../../../agent/monitoring-agent';
if (fs.existsSync(agentPath)) {
  const checksum = generateChecksum(agentPath);
  console.log('Agent checksum:', checksum);
} else {
  console.error('Agent binary not found at:', agentPath);
}
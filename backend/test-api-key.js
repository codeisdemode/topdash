const bcrypt = require('bcrypt');

async function testApiKey() {
  const apiKey = 'dev-api-key-1234567890';
  const storedHash = '$2b$12$ODI9C7qIAh0etbaI32bjr.VSlltdBzLBB99Y4IgDv4ZJFd281FdMm';
  
  console.log('Testing API key validation:');
  console.log('API Key:', apiKey);
  console.log('Stored Hash:', storedHash);
  
  const isValid = await bcrypt.compare(apiKey, storedHash);
  console.log('Is valid:', isValid);
  
  // Also test generating the same hash again
  const newHash = await bcrypt.hash(apiKey, 12);
  console.log('New hash:', newHash);
  console.log('New hash matches stored:', newHash === storedHash);
}

testApiKey().catch(console.error);
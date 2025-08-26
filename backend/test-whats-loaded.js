// Test what module is actually being loaded
console.log('Testing module loading...');

try {
  const result = require.resolve('./src/routes/auth');
  console.log('Module resolved to:', result);
  
  const moduleContent = require('fs').readFileSync(result, 'utf8');
  console.log('First few lines of module:');
  console.log(moduleContent.split('\n').slice(0, 5).join('\n'));
  
} catch (error) {
  console.log('Module not found:', error.message);
}

try {
  const result = require.resolve('./src/routes/auth-fixed');
  console.log('Fixed module resolved to:', result);
  
  const moduleContent = require('fs').readFileSync(result, 'utf8');
  console.log('First few lines of fixed module:');
  console.log(moduleContent.split('\n').slice(0, 5).join('\n'));
  
} catch (error) {
  console.log('Fixed module not found:', error.message);
}
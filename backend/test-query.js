const { query } = require('./src/utils/sqlite');

async function testQuery() {
  try {
    console.log('Testing INSERT query...');
    const result = await query(
      'INSERT INTO tenants (name, plan) VALUES ($1, $2) RETURNING id',
      ['Test Tenant', 'free']
    );
    console.log('Query result:', JSON.stringify(result, null, 2));
    
    console.log('Testing SELECT query...');
    const selectResult = await query('SELECT * FROM tenants WHERE name = $1', ['Test Tenant']);
    console.log('Select result:', JSON.stringify(selectResult, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testQuery();
const { query } = require('./src/utils/sqlite');

async function debugQuery() {
  try {
    console.log('Testing INSERT with RETURNING...');
    
    // Test the exact query from auth.js
    const result = await query(
      'INSERT INTO tenants (name, plan) VALUES ($1, $2) RETURNING id',
      ['Debug Tenant', 'free']
    );
    
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('Result type:', typeof result);
    console.log('Has rows:', result.rows !== undefined);
    console.log('Has lastID:', result.lastID !== undefined);
    console.log('Has rowCount:', result.rowCount !== undefined);
    
    if (result.rows) {
      console.log('Rows length:', result.rows.length);
      if (result.rows.length > 0) {
        console.log('First row:', result.rows[0]);
      }
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugQuery();
const express = require('express');
const { query } = require('./src/utils/sqlite');

const app = express();
app.use(express.json());

app.post('/test', async (req, res) => {
  try {
    console.log('Minimal test called');
    
    const result = await query(
      'INSERT INTO tenants (name, plan) VALUES ($1, $2) RETURNING id',
      ['Test', 'free']
    );
    
    console.log('Minimal test result:', JSON.stringify(result));
    console.log('Result keys:', Object.keys(result));
    
    if (!result.lastID) {
      return res.status(500).json({ error: 'Failed' });
    }
    
    res.json({ success: true, lastID: result.lastID });
    
  } catch (error) {
    console.error('Minimal test error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

app.listen(3002, () => {
  console.log('Test server running on port 3002');
});
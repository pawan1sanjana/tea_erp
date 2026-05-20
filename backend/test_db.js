require('dotenv').config({ path: './.env' });
const { pool, query, DB_TYPE } = require('./config/db-supabase');

async function test() {
  console.log('Testing connection with DB_TYPE:', DB_TYPE);
  try {
    const [rows] = await query('SELECT u.*, e.name as estate_name FROM users u LEFT JOIN estates e ON u.estate_id = e.id WHERE u.email = ?', ['admin@admin.com']);
    console.log('Query result:', rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

test();

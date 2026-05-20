const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
require('dotenv').config();

const DB_TYPE = process.env.DB_TYPE || 'mysql';

let pool;
let supabaseClient;

if (DB_TYPE === 'supabase') {
  // Supabase Client (recommended for auth + real-time)
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Service role key (backend only)

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment');
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);

  // Also create pg pool for direct queries if needed
  pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_NAME,
  });
} else if (DB_TYPE === 'postgres') {
  // Direct PostgreSQL connection
  pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_NAME || 'tea_erp',
  });
} else {
  // MySQL (legacy)
  const mysql = require('mysql2/promise');
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQL_NAME || process.env.DB_NAME || 'tea_erp',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

module.exports = {
  pool,
  supabaseClient,
  DB_TYPE,
  query: async (sql, values = []) => {
    if (DB_TYPE === 'supabase' || DB_TYPE === 'postgres') {
      const result = await pool.query(sql, values);
      return result;
    } else {
      // MySQL
      return await pool.query(sql, values);
    }
  },
};

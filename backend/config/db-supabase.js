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

const translateToPostgres = (sql) => {
  let pgSql = sql;
  
  // 1. Replace ? with $1, $2, etc. 
  // Note: This simple regex assumes ? is not used inside string literals.
  let paramIndex = 1;
  pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);
  
  // 2. Common MySQL functions
  pgSql = pgSql.replace(/\bCURDATE\(\)/gi, 'CURRENT_DATE');
  pgSql = pgSql.replace(/\bNOW\(\)/gi, 'CURRENT_TIMESTAMP');
  pgSql = pgSql.replace(/\bIFNULL\(/gi, 'COALESCE(');
  
  // 3. Date Math: DATE_SUB(val, INTERVAL x DAY) -> (val - INTERVAL 'x DAY')
  pgSql = pgSql.replace(/DATE_SUB\(([^,]+),\s*INTERVAL\s+(\d+)\s+DAY\)/gi, "($1 - INTERVAL '$2 DAY')");
  pgSql = pgSql.replace(/DATE_ADD\(([^,]+),\s*INTERVAL\s+(\d+)\s+DAY\)/gi, "($1 + INTERVAL '$2 DAY')");

  // 4. Extracts: MONTH(val) -> EXTRACT(MONTH FROM val)
  pgSql = pgSql.replace(/\bMONTH\(([^)]+)\)/gi, 'EXTRACT(MONTH FROM $1)');
  pgSql = pgSql.replace(/\bYEAR\(([^)]+)\)/gi, 'EXTRACT(YEAR FROM $1)');

  // 5. DATE_FORMAT -> to_char
  pgSql = pgSql.replace(/DATE_FORMAT\(([^,]+),\s*'%b'\)/gi, "to_char($1, 'Mon')");
  pgSql = pgSql.replace(/DATE_FORMAT\(([^,]+),\s*'%a'\)/gi, "to_char($1, 'Dy')");
  
  return pgSql;
};

module.exports = {
  pool,
  supabaseClient,
  DB_TYPE,
  query: async (sql, values = []) => {
    if (DB_TYPE === 'supabase' || DB_TYPE === 'postgres') {
      try {
        const pgSql = translateToPostgres(sql);
        const result = await pool.query(pgSql, values);
        
        // Postgres pg library returns an object { rows: [...] }
        // MySQL returns [rows, fields]. We simulate MySQL's return format:
        return [result.rows || [], result.fields || []];
      } catch (err) {
        console.error('[Postgres Query Error]', err.message);
        console.error('Original SQL:', sql);
        throw err;
      }
    } else {
      // MySQL
      return await pool.query(sql, values);
    }
  },
};

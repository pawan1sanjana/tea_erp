const mysql = require('mysql2/promise');
const { Pool } = require('pg');
require('dotenv').config();

const DB_TYPE = process.env.DB_TYPE || 'mysql';

let pool;

if (DB_TYPE === 'postgres') {
  // PostgreSQL configuration
  pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_NAME || 'tea_erp'
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  // Export query function for PostgreSQL
  pool.query = async (sql, values) => {
    const client = await pool.connect();
    try {
      return await client.query(sql, values);
    } finally {
      client.release();
    }
  };
} else {
  // MySQL configuration (default)
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQL_NAME || process.env.DB_NAME || 'tea_erp',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

module.exports = pool;
module.exports.DB_TYPE = DB_TYPE;

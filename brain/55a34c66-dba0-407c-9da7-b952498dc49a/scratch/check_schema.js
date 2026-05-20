const mysql = require('mysql2/promise');

async function checkSchema() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'erp'
  });

  const [rows] = await db.query('DESCRIBE attendance_muster');
  console.log(JSON.stringify(rows, null, 2));
  await db.end();
}

checkSchema().catch(console.error);

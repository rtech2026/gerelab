
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:a9cX%26D6pr%3DGtY7v@db.ydbsmdhhapkqtqgezkfj.supabase.co:5432/postgres'
});

async function run() {
  try {
    const res = await pool.query('SELECT * FROM "user" WHERE email = $1', ['contatord2023@gmail.com']);
    console.log('Existing user count:', res.rowCount);
    if (res.rowCount > 0) {
      console.log('User found:', res.rows[0]);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();


const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:a9cX%26D6pr%3DGtY7v@db.ydbsmdhhapkqtqgezkfj.supabase.co:5432/postgres'
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in public schema:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();

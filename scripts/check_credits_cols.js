
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:a9cX%26D6pr%3DGtY7v@db.ydbsmdhhapkqtqgezkfj.supabase.co:5432/postgres'
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'av_user_credits'
    `);
    console.log('Columns in av_user_credits:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();

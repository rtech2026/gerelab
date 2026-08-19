
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:a9cX%26D6pr%3DGtY7v@db.ydbsmdhhapkqtqgezkfj.supabase.co:5432/postgres'
});

async function run() {
  try {
    const userRes = await pool.query('SELECT id FROM "user" WHERE email = $1', ['contatord2023@gmail.com']);
    const adminId = userRes.rows[0].id;

    await pool.query(
      `INSERT INTO "av_user_credits" ("userId", "plan", "char_limit", "chars_used") 
       VALUES ($1, 'pro', 10000000, 0)
       ON CONFLICT ("userId") 
       DO UPDATE SET "plan" = 'pro', "char_limit" = 10000000, "chars_used" = 0`,
      [adminId]
    );
    console.log('Admin credits successfully set to 10,000,000 PRO!');
    
    const check = await pool.query('SELECT * FROM "av_user_credits" WHERE "userId" = $1', [adminId]);
    console.log('Current admin credits:', check.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();

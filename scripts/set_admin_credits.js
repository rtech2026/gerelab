
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:a9cX%26D6pr%3DGtY7v@db.ydbsmdhhapkqtqgezkfj.supabase.co:5432/postgres'
});

async function run() {
  try {
    const userRes = await pool.query('SELECT id FROM "user" WHERE email = $1', ['contatord2023@gmail.com']);
    if (userRes.rowCount === 0) {
      console.log('Admin user not found');
      return;
    }
    const adminId = userRes.rows[0].id;
    console.log('Admin user ID:', adminId);

    // Upsert credits
    const creditRes = await pool.query('SELECT * FROM "userCredits" WHERE "userId" = $1', [adminId]);
    if (creditRes.rowCount === 0) {
      await pool.query(
        'INSERT INTO "userCredits" ("userId", "plan", "charLimit", "charsUsed") VALUES ($1, $2, $3, $4)',
        [adminId, 'pro', 10000000, 0]
      );
      console.log('Inserted pro credits for admin');
    } else {
      await pool.query(
        'UPDATE "userCredits" SET "plan" = $1, "charLimit" = $2, "charsUsed" = 0 WHERE "userId" = $3',
        ['pro', 10000000, adminId]
      );
      console.log('Updated pro credits for admin');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();

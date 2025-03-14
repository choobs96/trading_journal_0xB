import pool from './db.js';

const testDB = async () => {
  try {
    const res = await pool.query('SELECT NOW() AS current_time');
    console.log('✅ Database connected successfully!');
    console.log('Current Time:', res.rows[0].current_time);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    pool.end();
  }
};

testDB();
-- test push

import { config } from './db.config';
import { Pool } from "pg";

// 這邊必須要獨立寫一個 pool，因為我們要在初始化時檢查是否要創建資料庫
const pool = new Pool({
  ...config,
  database: undefined
});


async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create database if it doesn't exist
    await client.query(`
      SELECT 'CREATE DATABASE ${process.env.POSTGRES_DB}'
      WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${process.env.POSTGRES_DB}')
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
  
}

// Run if this file is executed directly
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Database initialization completed');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database initialization failed:', err);
      process.exit(1);
    });
}

export { initDatabase }; 
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: 'postgres' // Connect to default postgres database first
});

async function initDatabase() {
  const client = await pool.connect();
  try {
    // Create database if it doesn't exist
    await client.query(`
      SELECT 'CREATE DATABASE vagent'
      WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'vagent')
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
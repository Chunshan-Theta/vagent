import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

import { getPool } from './pool';

const pool = getPool();

async function runMigrations() {
  const client = await pool.connect();
  try {
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    // Run each migration
    for (const file of files) {
      const migrationName = path.basename(file, '.sql');
      
      // Check if migration was already executed
      const { rows } = await client.query(
        'SELECT id FROM migrations WHERE name = $1',
        [migrationName]
      );

      if (rows.length === 0) {
        console.log(`Running migration: ${migrationName}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [migrationName]
          );
          await client.query('COMMIT');
          console.log(`Completed migration: ${migrationName}`);
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        }
      }
    }
  } finally {
    client.release();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migrations completed successfully');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

export { runMigrations }; 
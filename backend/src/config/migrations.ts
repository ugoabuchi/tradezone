import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

export async function runMigrations(pool: Pool) {
  const migrationsDir = path.join(__dirname, '../migrations');

  console.log('Running database migrations...');

  // Create migrations table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Get all migration files sorted by name
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  // Get already executed migrations
  const result = await pool.query('SELECT name FROM schema_migrations');
  const executedMigrations = result.rows.map((row) => row.name);

  for (const file of migrationFiles) {
    if (executedMigrations.includes(file)) {
      console.log(`⊘ Migration ${file} already executed, skipping...`);
      continue;
    }

    try {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      // Split by semicolon and filter empty statements
      const statements = sql
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of statements) {
        await pool.query(statement);
      }

      // Record migration execution
      await pool.query(
        'INSERT INTO schema_migrations (name) VALUES ($1)',
        [file]
      );

      console.log(`✓ Migration ${file} executed successfully`);
    } catch (error) {
      console.error(`✗ Migration ${file} failed:`, error);
      throw error;
    }
  }

  console.log('✓ All migrations completed');
}

// Run migrations if this file is executed directly
if (require.main === module) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  runMigrations(pool)
    .then(() => {
      console.log('✓ Database migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('✗ Database migrations failed:', error);
      process.exit(1);
    })
    .finally(() => {
      pool.end();
    });
}

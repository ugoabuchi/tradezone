import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

interface MigrationPool {
  query: (sql: string, params?: any[]) => Promise<any>;
}

function convertPlaceholders(sql: string): string {
  return sql.replace(/\$\d+/g, '?');
}

export async function runMigrations(pool: MigrationPool) {
  const migrationsDir = path.join(__dirname, '../migrations');

  console.log('Running database migrations...');

  // Create migrations table if it doesn't exist (MySQL syntax)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // Get all migration files sorted by name
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  // Get already executed migrations
  const [rows] = await pool.query('SELECT name FROM schema_migrations');
  const executedMigrations = (rows as any[]).map((row) => row.name);

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
        const stmt = convertPlaceholders(statement);
        await pool.query(stmt);
      }

      // Record migration execution
      await pool.query(
        'INSERT INTO schema_migrations (name) VALUES (?)',
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
  const pool = mysql.createPool(process.env.DATABASE_URL!);

  runMigrations(pool as any)
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

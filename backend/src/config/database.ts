import mysql from 'mysql2/promise';

/**
 * Wrapper around a MySQL connection pool.
 *
 * Existing code throughout the project uses PostgreSQL-style placeholders
 * (`$1`, `$2`, etc.).  The MySQL driver expects `?` placeholders, so we
 * convert them automatically here.  This keeps the SQL in models unchanged
 * when switching from Postgres to MySQL.
 */

const pool = mysql.createPool(process.env.DATABASE_URL!);

export const getConnection = () => pool;

function convertPlaceholders(sql: string): string {
  // replace $1, $2, ... with ? (mysql2 will map each ? to the next value)
  return sql.replace(/\$\d+/g, '?');
}

export const query = (text: string, params?: any[]) => {
  const sql = convertPlaceholders(text);
  return pool.query(sql, params);
};

export const getClient = async () => {
  return pool.getConnection();
};

export default pool;

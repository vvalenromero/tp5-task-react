/** Pool de conexiones a PostgreSQL. Se arma de forma diferida para que importar este módulo nunca reviente. */

import pg from 'pg';

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (pool === null) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}

/** Chequeo de salud que usa GET /api/health. */
export async function pingDatabase() {
  try {
    await getPool().query('SELECT 1');
    return 'up';
  } catch {
    return 'down';
  }
}

export async function closePool() {
  if (pool !== null) {
    await pool.end();
    pool = null;
  }
}

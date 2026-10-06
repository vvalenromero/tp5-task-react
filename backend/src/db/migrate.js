/**
 * Runner de migraciones, minimo y solo para adelante.
 *
 * Aplica todos los `.sql` de `db/migrations/` en orden de nombre y anota los que
 * ya aplico, así levantar la API dos veces no rompe nada. Sin herramienta
 * externa de migraciones: una dependencia menos que explicar.
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getPool } from './pool.js';

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../db/migrations',
);

const CREATE_TRACKING_TABLE = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename   varchar(255) PRIMARY KEY,
    applied_at timestamptz  NOT NULL DEFAULT now()
  );
`;

export async function runMigrations() {
  const pool = getPool();
  await pool.query(CREATE_TRACKING_TABLE);

  const { rows } = await pool.query('SELECT filename FROM schema_migrations');
  const aplicadas = new Set(rows.map((row) => row.filename));

  const archivos = (await readdir(MIGRATIONS_DIR))
    .filter((archivo) => archivo.endsWith('.sql'))
    .sort();

  let nuevas = 0;

  for (const archivo of archivos) {
    if (aplicadas.has(archivo)) continue;

    const sql = await readFile(path.join(MIGRATIONS_DIR, archivo), 'utf8');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [archivo]);
      await client.query('COMMIT');
      nuevas += 1;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Fallo la migracion ${archivo}: ${error.message}`);
    } finally {
      client.release();
    }
  }

  return { total: archivos.length, aplicadas: nuevas };
}

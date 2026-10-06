/** Levanta la API: aplica las migraciones pendientes y después se pone a escuchar. */

import 'dotenv/config';

import { createApp } from './app.js';
import { runMigrations } from './db/migrate.js';

const PORT = Number(process.env.PORT ?? 3000);

async function main() {
  try {
    const { aplicadas, total } = await runMigrations();
    console.log(`[server] migraciones al dia (${aplicadas} nuevas de ${total})`);
  } catch (error) {
    console.error('[server] no se pudieron aplicar las migraciones:', error.message);
    process.exit(1);
  }

  createApp().listen(PORT, () => {
    console.log(`[server] API escuchando en http://localhost:${PORT}`);
  });
}

main();

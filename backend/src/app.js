/**
 * Fabrica de la app de Express.
 *
 * Se arma y se exporta sin escuchar, así los tests la importan y la manejan con
 * supertest. Express 5 manda solo los handlers async rechazados al middleware
 * de errores, por eso las rutas no tienen try/catch.
 */

import cors from 'cors';
import express from 'express';

import { pingDatabase } from './db/pool.js';
import { taskRepository } from './repositories/taskRepository.js';
import { crearRouterTareas } from './routes/tasks.js';

export function createApp({ repository = taskRepository, ping = pingDatabase } = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use('/api', crearRouterTareas(repository, { ping }));

  app.use((_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada.', code: 'NO_ENCONTRADA' });
  });

  // eslint-disable-next-line no-unused-vars -- Express reconoce el middleware de errores por la cantidad de parámetros.
  app.use((error, _req, res, _next) => {
    console.error('[api] error inesperado:', error);
    res.status(500).json({ error: 'Ocurrio un error interno.', code: 'ERROR_INTERNO' });
  });

  return app;
}

export default createApp;

/** Rutas REST del manejador de tareas, montadas bajo `/api`. */

import { Router } from 'express';

import { finalizar, validarActualizacion, validarCreacion } from '../domain/task.js';

const noEncontrada = (res) =>
  res.status(404).json({ error: 'No existe una tarea con ese id.', code: 'NO_ENCONTRADA' });

const invalida = (res, detalles) =>
  res.status(400).json({
    error: 'La tarea tiene datos invalidos.',
    code: 'VALIDACION',
    detalles,
  });

export function crearRouterTareas(repository, { ping } = {}) {
  const router = Router();

  router.get('/health', async (_req, res) => {
    const db = ping ? await ping() : 'unknown';
    res.json({ status: 'ok', db });
  });

  router.get('/tasks', async (req, res) => {
    const { estado, prioridad, sprint, personaAsignada } = req.query;
    const tareas = await repository.listar({ estado, prioridad, sprint, personaAsignada });
    res.json(tareas);
  });

  router.get('/tasks/:id', async (req, res) => {
    const tarea = await repository.obtener(req.params.id);
    if (!tarea) return noEncontrada(res);
    return res.json(tarea);
  });

  router.post('/tasks', async (req, res) => {
    const resultado = validarCreacion(req.body);
    if (!resultado.ok) return invalida(res, resultado.detalles);

    const creada = await repository.insertar(resultado.task);
    return res.status(201).json(creada);
  });

  router.put('/tasks/:id', async (req, res) => {
    const resultado = validarActualizacion(req.body);
    if (!resultado.ok) return invalida(res, resultado.detalles);

    const actual = await repository.obtener(req.params.id);
    if (!actual) return noEncontrada(res);

    if (actual.estado === 'finalizada') {
      return res.status(409).json({
        error: 'Una tarea finalizada no se puede editar.',
        code: 'TAREA_FINALIZADA_NO_EDITABLE',
      });
    }

    const actualizada = await repository.actualizar(req.params.id, {
      ...resultado.task,
      id: req.params.id,
    });

    return res.json(actualizada);
  });

  router.patch('/tasks/:id/finalizar', async (req, res) => {
    const actual = await repository.obtener(req.params.id);
    if (!actual) return noEncontrada(res);

    const resultado = finalizar(actual);
    if (!resultado.ok) {
      return res.status(409).json({
        error: 'La tarea ya estaba finalizada.',
        code: resultado.code,
      });
    }

    const cerrada = await repository.finalizar(req.params.id, resultado.task.fechaCierre);
    return res.json(cerrada);
  });

  router.delete('/tasks/:id', async (req, res) => {
    const eliminada = await repository.eliminar(req.params.id);
    if (!eliminada) return noEncontrada(res);
    return res.status(204).end();
  });

  return router;
}

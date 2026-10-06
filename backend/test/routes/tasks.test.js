/**
 * Tests de las rutas, con supertest contra la app exportada.
 *
 * El repositorio se inyecta, así que toda la suite corre sin una instancia de
 * PostgreSQL. La capa SQL real se cubre con el end-to-end (T9).
 */

import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';

const payloadValido = () => ({
  nombreProyecto: 'Portal de inscripciones',
  tipoActividad: 'feature',
  resumen: 'Alta de postulantes',
  descripcion: 'Formulario publico que registra postulantes.',
  prioridad: 'alta',
  informador: 'Ernesto Ledesma',
  personaAsignada: 'Valentin Romero',
  precondicion: 'Circuito de pagos cerrado',
  sprint: 'Sprint 4',
});

/** Reemplazo en memoria con el mismo contrato que el repositorio real. */
function repositorioFalso() {
  const tareas = new Map();

  return {
    async listar(filtros = {}) {
      return [...tareas.values()].filter((tarea) =>
        Object.entries({
          estado: tarea.estado,
          prioridad: tarea.prioridad,
          sprint: tarea.sprint,
          personaAsignada: tarea.personaAsignada,
        }).every(([clave, valor]) => {
          const esperado = filtros[clave];
          return esperado === undefined || esperado === '' || esperado === valor;
        }),
      );
    },
    async obtener(id) {
      return tareas.get(id) ?? null;
    },
    async insertar(tarea) {
      tareas.set(tarea.id, tarea);
      return tarea;
    },
    async actualizar(id, cambios) {
      const actualizada = { ...tareas.get(id), ...cambios, id };
      tareas.set(id, actualizada);
      return actualizada;
    },
    async finalizar(id, fechaCierre) {
      const cerrada = { ...tareas.get(id), estado: 'finalizada', fechaCierre };
      tareas.set(id, cerrada);
      return cerrada;
    },
    async eliminar(id) {
      return tareas.delete(id);
    },
  };
}

let app;

beforeEach(() => {
  app = createApp({ repository: repositorioFalso(), ping: async () => 'up' });
});

/** Crea una tarea y devuelve su id. */
async function crearTarea(extra = {}) {
  const respuesta = await request(app)
    .post('/api/tasks')
    .send({ ...payloadValido(), ...extra })
    .expect(201);

  return respuesta.body.id;
}

describe('GET /api/health', () => {
  it('reporta el estado del servicio y de la base', async () => {
    const respuesta = await request(app).get('/api/health').expect(200);

    expect(respuesta.body).toEqual({ status: 'ok', db: 'up' });
  });
});

describe('POST /api/tasks', () => {
  it('crea la tarea y la devuelve con estado inicial', async () => {
    const respuesta = await request(app).post('/api/tasks').send(payloadValido()).expect(201);

    expect(respuesta.body).toMatchObject({
      nombreProyecto: 'Portal de inscripciones',
      estado: 'nueva',
      fechaCierre: null,
    });
    expect(respuesta.body.id).toEqual(expect.any(String));
  });

  it('rechaza el alta incompleta con el detalle por campo', async () => {
    const respuesta = await request(app)
      .post('/api/tasks')
      .send({ nombreProyecto: 'Solo el nombre' })
      .expect(400);

    expect(respuesta.body.code).toBe('VALIDACION');
    expect(respuesta.body.detalles.map((detalle) => detalle.campo)).toContain('sprint');
  });

  it('rechaza un enumerado invalido', async () => {
    const respuesta = await request(app)
      .post('/api/tasks')
      .send({ ...payloadValido(), prioridad: 'urgentisima' })
      .expect(400);

    expect(respuesta.body.detalles.map((detalle) => detalle.campo)).toContain('prioridad');
  });
});

describe('GET /api/tasks', () => {
  it('lista las tareas creadas', async () => {
    await crearTarea();
    await crearTarea({ nombreProyecto: 'Backoffice de taller' });

    const respuesta = await request(app).get('/api/tasks').expect(200);

    expect(respuesta.body).toHaveLength(2);
  });

  it('filtra por prioridad', async () => {
    await crearTarea({ prioridad: 'baja' });
    await crearTarea({ prioridad: 'critica' });

    const respuesta = await request(app).get('/api/tasks?prioridad=critica').expect(200);

    expect(respuesta.body).toHaveLength(1);
    expect(respuesta.body[0].prioridad).toBe('critica');
  });
});

describe('GET /api/tasks/:id', () => {
  it('devuelve la tarea pedida', async () => {
    const id = await crearTarea();

    const respuesta = await request(app).get(`/api/tasks/${id}`).expect(200);

    expect(respuesta.body.id).toBe(id);
  });

  it('responde 404 cuando no existe', async () => {
    const respuesta = await request(app).get('/api/tasks/no-existe').expect(404);

    expect(respuesta.body.code).toBe('NO_ENCONTRADA');
  });
});

describe('PUT /api/tasks/:id', () => {
  it('edita la tarea', async () => {
    const id = await crearTarea();

    const respuesta = await request(app)
      .put(`/api/tasks/${id}`)
      .send({ ...payloadValido(), prioridad: 'critica', resumen: 'Alta de postulantes 2027' })
      .expect(200);

    expect(respuesta.body.prioridad).toBe('critica');
    expect(respuesta.body.resumen).toBe('Alta de postulantes 2027');
  });

  it('responde 404 cuando la tarea no existe', async () => {
    await request(app).put('/api/tasks/no-existe').send(payloadValido()).expect(404);
  });

  it('no permite editar una tarea finalizada', async () => {
    const id = await crearTarea();
    await request(app).patch(`/api/tasks/${id}/finalizar`).expect(200);

    const respuesta = await request(app)
      .put(`/api/tasks/${id}`)
      .send(payloadValido())
      .expect(409);

    expect(respuesta.body.code).toBe('TAREA_FINALIZADA_NO_EDITABLE');
  });
});

describe('PATCH /api/tasks/:id/finalizar', () => {
  it('finaliza la tarea y sella la fecha de cierre', async () => {
    const id = await crearTarea();

    const respuesta = await request(app).patch(`/api/tasks/${id}/finalizar`).expect(200);

    expect(respuesta.body.estado).toBe('finalizada');
    expect(Number.isNaN(Date.parse(respuesta.body.fechaCierre))).toBe(false);
  });

  it('responde 409 si la tarea ya estaba finalizada', async () => {
    const id = await crearTarea();
    await request(app).patch(`/api/tasks/${id}/finalizar`).expect(200);

    const respuesta = await request(app).patch(`/api/tasks/${id}/finalizar`).expect(409);

    expect(respuesta.body.code).toBe('TAREA_YA_FINALIZADA');
  });

  it('responde 404 cuando la tarea no existe', async () => {
    await request(app).patch('/api/tasks/no-existe/finalizar').expect(404);
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('elimina la tarea', async () => {
    const id = await crearTarea();

    await request(app).delete(`/api/tasks/${id}`).expect(204);
    await request(app).get(`/api/tasks/${id}`).expect(404);
  });

  it('responde 404 cuando la tarea no existe', async () => {
    await request(app).delete('/api/tasks/no-existe').expect(404);
  });
});

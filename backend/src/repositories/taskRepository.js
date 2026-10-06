/**
 * Repositorio de tareas contra PostgreSQL.
 *
 * Es el único lugar donde las columnas snake_case de la base se mapean a los
 * nombres camelCase de la API, así el resto de la app conoce una sola forma.
 */

import { getPool } from '../db/pool.js';

const COLUMNAS = `
  id,
  nombre_proyecto,
  tipo_actividad,
  estado,
  resumen,
  descripcion,
  prioridad,
  informador,
  persona_asignada,
  precondicion,
  fecha_creacion,
  fecha_cierre,
  sprint
`;

/** Fila de la base -> tarea de la API. */
export function aTarea(row) {
  if (!row) return null;

  return {
    id: row.id,
    nombreProyecto: row.nombre_proyecto,
    tipoActividad: row.tipo_actividad,
    estado: row.estado,
    resumen: row.resumen,
    descripcion: row.descripcion,
    prioridad: row.prioridad,
    informador: row.informador,
    personaAsignada: row.persona_asignada,
    precondicion: row.precondicion,
    fechaCreacion: row.fecha_creacion?.toISOString() ?? null,
    fechaCierre: row.fecha_cierre?.toISOString() ?? null,
    sprint: row.sprint,
  };
}

const FILTROS = {
  estado: 'estado',
  prioridad: 'prioridad',
  sprint: 'sprint',
  personaAsignada: 'persona_asignada',
};

export function crearTaskRepository(poolPropio = null) {
  const db = () => poolPropio ?? getPool();

  return {
    async listar(filtros = {}) {
      const condiciones = [];
      const valores = [];

      for (const [clave, columna] of Object.entries(FILTROS)) {
        const valor = filtros[clave];
        if (valor === undefined || valor === null || valor === '') continue;
        valores.push(valor);
        condiciones.push(`${columna} = $${valores.length}`);
      }

      const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
      const { rows } = await db().query(
        `SELECT ${COLUMNAS} FROM tasks ${where} ORDER BY fecha_creacion DESC`,
        valores,
      );

      return rows.map(aTarea);
    },

    async obtener(id) {
      const { rows } = await db().query(`SELECT ${COLUMNAS} FROM tasks WHERE id = $1`, [id]);
      return aTarea(rows[0]);
    },

    async insertar(tarea) {
      const { rows } = await db().query(
        `INSERT INTO tasks (${COLUMNAS})
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING ${COLUMNAS}`,
        [
          tarea.id,
          tarea.nombreProyecto,
          tarea.tipoActividad,
          tarea.estado,
          tarea.resumen,
          tarea.descripcion,
          tarea.prioridad,
          tarea.informador,
          tarea.personaAsignada,
          tarea.precondicion,
          tarea.fechaCreacion,
          tarea.fechaCierre,
          tarea.sprint,
        ],
      );

      return aTarea(rows[0]);
    },

    async actualizar(id, tarea) {
      const { rows } = await db().query(
        `UPDATE tasks
            SET nombre_proyecto  = $2,
                tipo_actividad   = $3,
                estado           = $4,
                resumen          = $5,
                descripcion      = $6,
                prioridad        = $7,
                informador       = $8,
                persona_asignada = $9,
                precondicion     = $10,
                fecha_creacion   = $11,
                sprint           = $12
          WHERE id = $1
      RETURNING ${COLUMNAS}`,
        [
          id,
          tarea.nombreProyecto,
          tarea.tipoActividad,
          tarea.estado,
          tarea.resumen,
          tarea.descripcion,
          tarea.prioridad,
          tarea.informador,
          tarea.personaAsignada,
          tarea.precondicion,
          tarea.fechaCreacion,
          tarea.sprint,
        ],
      );

      return aTarea(rows[0]);
    },

    async finalizar(id, fechaCierre) {
      const { rows } = await db().query(
        `UPDATE tasks
            SET estado = 'finalizada', fecha_cierre = $2
          WHERE id = $1
      RETURNING ${COLUMNAS}`,
        [id, fechaCierre],
      );

      return aTarea(rows[0]);
    },

    async eliminar(id) {
      const { rowCount } = await db().query('DELETE FROM tasks WHERE id = $1', [id]);
      return rowCount > 0;
    },
  };
}

/** Repositorio por defecto, atado al pool compartido. */
export const taskRepository = crearTaskRepository();

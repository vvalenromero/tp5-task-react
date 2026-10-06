/** Cliente de la API de tareas. Todas las llamadas son relativas a `/api`. */

import type { Tarea, TareaEditable } from '../types/task';

const BASE = '/api';

export interface DetalleValidacion {
  campo: string;
  mensaje: string;
}

/** Error que trae los codigos del backend y el detalle de validación por campo. */
export class ErrorApi extends Error {
  code: string;

  detalles: DetalleValidacion[];

  constructor(mensaje: string, code = 'ERROR_DESCONOCIDO', detalles: DetalleValidacion[] = []) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.code = code;
    this.detalles = detalles;
  }
}

async function pedir<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const respuesta = await fetch(`${BASE}${ruta}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (respuesta.status === 204) return undefined as T;

  const cuerpo = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new ErrorApi(
      typeof cuerpo.error === 'string' ? cuerpo.error : 'La operacion fallo.',
      typeof cuerpo.code === 'string' ? cuerpo.code : 'ERROR_DESCONOCIDO',
      Array.isArray(cuerpo.detalles) ? cuerpo.detalles : [],
    );
  }

  return cuerpo as T;
}

export const apiTareas = {
  listar: () => pedir<Tarea[]>('/tasks'),

  crear: (tarea: TareaEditable) =>
    pedir<Tarea>('/tasks', { method: 'POST', body: JSON.stringify(tarea) }),

  actualizar: (id: string, tarea: TareaEditable) =>
    pedir<Tarea>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(tarea) }),

  finalizar: (id: string) => pedir<Tarea>(`/tasks/${id}/finalizar`, { method: 'PATCH' }),

  eliminar: (id: string) => pedir<void>(`/tasks/${id}`, { method: 'DELETE' }),
};

/**
 * Logica de negocio del manejador de tareas.
 *
 * Solo funciones puras: nada de entrada/salida, ni Express, ni base de datos.
 * La consigna pide la lógica de negocio como manejador de tareas, así que la
 * validación esta escrita a mano en vez de delegada a una libreria de schemas.
 */

import { randomUUID } from 'node:crypto';

export const TIPOS_ACTIVIDAD = [
  'feature',
  'bug',
  'refactor',
  'documentacion',
  'pruebas',
  'investigacion',
  'despliegue',
  'soporte',
];

export const ESTADOS = ['nueva', 'en_progreso', 'bloqueada', 'en_revision', 'finalizada'];

export const PRIORIDADES = ['baja', 'media', 'alta', 'critica'];

export const ESTADO_INICIAL = 'nueva';
export const ESTADO_FINAL = 'finalizada';

/** Largo maximo de cada campo de texto, tal cual la consigna. */
const LIMITES = {
  nombreProyecto: 120,
  resumen: 200,
  descripcion: 5000,
  precondicion: 500,
  informador: 80,
  personaAsignada: 80,
  sprint: 40,
};

const OBLIGATORIOS = [
  'nombreProyecto',
  'tipoActividad',
  'resumen',
  'descripcion',
  'prioridad',
  'informador',
  'personaAsignada',
  'sprint',
];

const ENUMERADOS = {
  tipoActividad: TIPOS_ACTIVIDAD,
  estado: ESTADOS,
  prioridad: PRIORIDADES,
};

const CAMPOS_TEXTO = [
  'nombreProyecto',
  'tipoActividad',
  'estado',
  'resumen',
  'descripcion',
  'prioridad',
  'informador',
  'personaAsignada',
  'precondicion',
  'sprint',
];

/** Lee un campo de texto y lo recorta; cualquier otra cosa cuenta como vacio. */
function leerTexto(valor) {
  if (typeof valor !== 'string') return '';
  return valor.trim();
}

/** Pasa una fecha a ISO 8601, o null si no se puede usar. */
function normalizarFecha(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toISOString();
}

function detalle(campo, mensaje) {
  return { campo, mensaje };
}

function validarCampos(payload) {
  const detalles = [];

  for (const campo of OBLIGATORIOS) {
    if (leerTexto(payload[campo]) === '') {
      detalles.push(detalle(campo, `El campo ${campo} es obligatorio.`));
    }
  }

  for (const [campo, maximo] of Object.entries(LIMITES)) {
    if (leerTexto(payload[campo]).length > maximo) {
      detalles.push(detalle(campo, `El campo ${campo} no puede superar los ${maximo} caracteres.`));
    }
  }

  for (const [campo, permitidos] of Object.entries(ENUMERADOS)) {
    const valor = leerTexto(payload[campo]);
    if (valor === '') continue;
    if (!permitidos.includes(valor)) {
      detalles.push(
        detalle(campo, `El campo ${campo} debe ser uno de: ${permitidos.join(', ')}.`),
      );
    }
  }

  // La fecha de cierre la pone la operación de finalizar, nunca el cliente.
  if (payload.fechaCierre !== undefined && payload.fechaCierre !== null) {
    detalles.push(
      detalle('fechaCierre', 'La fecha de cierre la asigna la operacion de finalizar.'),
    );
  }

  if (payload.fechaCreacion !== undefined && payload.fechaCreacion !== null) {
    if (normalizarFecha(payload.fechaCreacion) === null) {
      detalles.push(detalle('fechaCreacion', 'La fecha de creacion no es una fecha valida.'));
    }
  }

  return detalles;
}

/** Arma la tarea tal como la devuelve la API, a partir de un payload ya validado. */
function construirTarea(payload) {
  const tarea = {};

  for (const campo of CAMPOS_TEXTO) {
    tarea[campo] = leerTexto(payload[campo]);
  }

  tarea.nombreProyecto = tarea.nombreProyecto || '';
  tarea.estado = tarea.estado || ESTADO_INICIAL;
  tarea.tipoActividad = tarea.tipoActividad || '';
  tarea.fechaCreacion = normalizarFecha(payload.fechaCreacion) ?? new Date().toISOString();
  tarea.fechaCierre = null;

  return tarea;
}

function fallo(detalles) {
  return { ok: false, code: 'VALIDACION', detalles };
}

/**
 * Valida el payload de un alta.
 * @returns {{ok: true, task: object} | {ok: false, code: string, detalles: object[]}}
 */
export function validarCreacion(payload = {}) {
  const detalles = validarCampos(payload);
  if (detalles.length > 0) return fallo(detalles);

  return { ok: true, task: { id: randomUUID(), ...construirTarea(payload) } };
}

/**
 * Valida el payload de una edicion. Cerrar una tarea no es editar: tiene su
 * propia operación, por eso acá se rechaza `estado: 'finalizada'`.
 */
export function validarActualizacion(payload = {}) {
  const detalles = validarCampos(payload);

  if (leerTexto(payload.estado) === ESTADO_FINAL) {
    detalles.push(
      detalle('estado', 'Para cerrar una tarea usa la operacion de finalizar.'),
    );
  }

  if (detalles.length > 0) return fallo(detalles);

  return { ok: true, task: construirTarea(payload) };
}

/**
 * Finaliza una tarea: la pasa a `finalizada` y le sella la fecha de cierre.
 * @returns {{ok: true, task: object} | {ok: false, code: string, detalles: object[]}}
 */
export function finalizar(tarea, momento = new Date()) {
  if (tarea.estado === ESTADO_FINAL) {
    return {
      ok: false,
      code: 'TAREA_YA_FINALIZADA',
      detalles: [detalle('estado', 'La tarea ya estaba finalizada.')],
    };
  }

  return {
    ok: true,
    task: { ...tarea, estado: ESTADO_FINAL, fechaCierre: normalizarFecha(momento) },
  };
}

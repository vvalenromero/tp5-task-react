/**
 * La forma de una tarea, con los doce campos que pide la consigna.
 *
 * Los tipos union salen de los arrays `as const`, así la misma lista alimenta las
 * opciones de los <select>, los badges del listado y el tipo de TypeScript.
 */

export const TIPOS_ACTIVIDAD = [
  'feature',
  'bug',
  'refactor',
  'documentacion',
  'pruebas',
  'investigacion',
  'despliegue',
  'soporte',
] as const;

export const ESTADOS = ['nueva', 'en_progreso', 'bloqueada', 'en_revision', 'finalizada'] as const;

export const PRIORIDADES = ['baja', 'media', 'alta', 'critica'] as const;

export type TipoActividad = (typeof TIPOS_ACTIVIDAD)[number];
export type Estado = (typeof ESTADOS)[number];
export type Prioridad = (typeof PRIORIDADES)[number];

/** Etiquetas en castellano para los valores crudos de los enums. */
export const ETIQUETAS_TIPO_ACTIVIDAD: Record<TipoActividad, string> = {
  feature: 'Nueva funcionalidad',
  bug: 'Corrección de error',
  refactor: 'Refactorización',
  documentacion: 'Documentación',
  pruebas: 'Pruebas',
  investigacion: 'Investigación',
  despliegue: 'Despliegue',
  soporte: 'Soporte',
};

export const ETIQUETAS_ESTADO: Record<Estado, string> = {
  nueva: 'Nueva',
  en_progreso: 'En progreso',
  bloqueada: 'Bloqueada',
  en_revision: 'En revisión',
  finalizada: 'Finalizada',
};

export const ETIQUETAS_PRIORIDAD: Record<Prioridad, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
};

export interface Tarea {
  id: string;
  nombreProyecto: string;
  tipoActividad: TipoActividad;
  estado: Estado;
  resumen: string;
  descripcion: string;
  prioridad: Prioridad;
  informador: string;
  personaAsignada: string;
  precondicion: string;
  fechaCreacion: string;
  fechaCierre: string | null;
  sprint: string;
}

/**
 * La parte de la tarea que maneja el formulario. El `id` lo asigna el backend y
 * la `fechaCierre` la sella la operación de finalizar, así que ninguna de las
 * dos se escribe a mano.
 */
export type TareaEditable = Omit<Tarea, 'id' | 'fechaCierre'>;

export const ESTADO_INICIAL: Estado = 'nueva';

/** Formulario en blanco, también se usa para resetear después de un alta. */
export function tareaVacia(): TareaEditable {
  return {
    nombreProyecto: '',
    tipoActividad: 'feature',
    estado: ESTADO_INICIAL,
    resumen: '',
    descripcion: '',
    prioridad: 'media',
    informador: '',
    personaAsignada: '',
    precondicion: '',
    fechaCreacion: new Date().toISOString().slice(0, 10),
    sprint: '',
  };
}

/** Convierte una tarea que viene de la API a la forma que usa el formulario. */
export function aEditable(tarea: Tarea): TareaEditable {
  return {
    nombreProyecto: tarea.nombreProyecto,
    tipoActividad: tarea.tipoActividad,
    estado: tarea.estado,
    resumen: tarea.resumen,
    descripcion: tarea.descripcion,
    prioridad: tarea.prioridad,
    informador: tarea.informador,
    personaAsignada: tarea.personaAsignada,
    precondicion: tarea.precondicion,
    fechaCreacion: tarea.fechaCreacion.slice(0, 10),
    sprint: tarea.sprint,
  };
}

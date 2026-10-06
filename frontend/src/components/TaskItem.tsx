import {
  ETIQUETAS_ESTADO,
  ETIQUETAS_PRIORIDAD,
  ETIQUETAS_TIPO_ACTIVIDAD,
} from '../types/task';
import type { Tarea } from '../types/task';

/**
 * Formatea una fecha ISO como dd/mm/aaaa.
 *
 * Usa las partes en UTC a proposito: un campo de solo fecha no puede cambiar de
 * significado segun el huso horario de la maquina.
 */
export function formatearFecha(iso: string | null): string {
  if (!iso) return '—';

  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '—';

  const dia = String(fecha.getUTCDate()).padStart(2, '0');
  const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');

  return `${dia}/${mes}/${fecha.getUTCFullYear()}`;
}

interface TaskItemProps {
  tarea: Tarea;
  onEditar: (tarea: Tarea) => void;
  onEliminar: (id: string) => void;
  onFinalizar: (id: string) => void;
}

export function TaskItem({ tarea, onEditar, onEliminar, onFinalizar }: TaskItemProps) {
  const finalizada = tarea.estado === 'finalizada';

  return (
    <li className={`tarea tarea--${tarea.estado}`}>
      <div className="tarea__cabecera">
        <h3>{tarea.nombreProyecto}</h3>
        <div className="tarea__etiquetas">
          <span className={`badge badge--estado badge--${tarea.estado}`}>
            {ETIQUETAS_ESTADO[tarea.estado]}
          </span>
          <span className={`badge badge--prioridad badge--${tarea.prioridad}`}>
            {ETIQUETAS_PRIORIDAD[tarea.prioridad]}
          </span>
        </div>
      </div>

      <p className="tarea__resumen">{tarea.resumen}</p>

      <dl className="tarea__detalle">
        <div>
          <dt>Tipo de actividad</dt>
          <dd>{ETIQUETAS_TIPO_ACTIVIDAD[tarea.tipoActividad]}</dd>
        </div>
        <div className="tarea__detalle--ancho">
          <dt>Descripción</dt>
          <dd>{tarea.descripcion}</dd>
        </div>
        <div>
          <dt>Informador</dt>
          <dd>{tarea.informador}</dd>
        </div>
        <div>
          <dt>Persona asignada</dt>
          <dd>{tarea.personaAsignada}</dd>
        </div>
        <div>
          <dt>Precondición</dt>
          <dd>{tarea.precondicion || '—'}</dd>
        </div>
        <div>
          <dt>Sprint</dt>
          <dd>{tarea.sprint}</dd>
        </div>
        <div>
          <dt>Fecha de creación</dt>
          <dd>{formatearFecha(tarea.fechaCreacion)}</dd>
        </div>
        <div>
          <dt>Fecha de cierre</dt>
          <dd>{formatearFecha(tarea.fechaCierre)}</dd>
        </div>
      </dl>

      <div className="tarea__acciones">
        <button type="button" onClick={() => onEditar(tarea)} disabled={finalizada}>
          Editar
        </button>
        <button type="button" onClick={() => onFinalizar(tarea.id)} disabled={finalizada}>
          Finalizar
        </button>
        <button type="button" className="peligro" onClick={() => onEliminar(tarea.id)}>
          Eliminar
        </button>
      </div>
    </li>
  );
}

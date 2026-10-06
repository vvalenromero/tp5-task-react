import { useState } from 'react';
import type { FormEvent } from 'react';

import type { DetalleValidacion } from '../api/tasks';
import {
  ESTADOS,
  ETIQUETAS_ESTADO,
  ETIQUETAS_PRIORIDAD,
  ETIQUETAS_TIPO_ACTIVIDAD,
  PRIORIDADES,
  TIPOS_ACTIVIDAD,
} from '../types/task';
import type { Estado, Prioridad, TipoActividad, TareaEditable } from '../types/task';
/**
 * Los doce campos de la consigna. Cerrar una tarea no se hace desde el
 * formulario, por eso "finalizada" no aparece como opcion: para eso esta el
 * boton Finalizar del listado.
 */
const ESTADOS_EDITABLES = ESTADOS.filter((estado) => estado !== 'finalizada');

const OBLIGATORIOS: { campo: keyof TareaEditable; etiqueta: string }[] = [
  { campo: 'nombreProyecto', etiqueta: 'El Nombre del Proyecto' },
  { campo: 'resumen', etiqueta: 'El Resumen' },
  { campo: 'descripcion', etiqueta: 'La Descripción' },
  { campo: 'informador', etiqueta: 'El Informador' },
  { campo: 'personaAsignada', etiqueta: 'La Persona asignada' },
  { campo: 'sprint', etiqueta: 'El Sprint' },
];

/**
 * Campos que muestran su propio mensaje de error abajo del input. Cualquier otro
 * error (un enum rechazado, por ejemplo) se lista una sola vez en la alerta del
 * formulario, para no mostrar lo mismo dos veces.
 */
const CAMPOS_CON_ERROR_EN_LINEA = new Set<string>(OBLIGATORIOS.map(({ campo }) => campo));

interface TaskFormProps {
  valorInicial: TareaEditable;
  onGuardar: (tarea: TareaEditable) => void;
  onCancelar: () => void;
  editando?: boolean;
  fechaCierre?: string | null;
  errores?: DetalleValidacion[];
}

export type { TaskFormProps };

export function TaskForm({
  valorInicial,
  onGuardar,
  onCancelar,
  editando = false,
  fechaCierre = null,
  errores = [],
}: TaskFormProps) {
  const [tarea, setTarea] = useState<TareaEditable>(valorInicial);
  const [erroresLocales, setErroresLocales] = useState<DetalleValidacion[]>([]);

  function cambiar<K extends keyof TareaEditable>(campo: K, valor: TareaEditable[K]) {
    setTarea((actual) => ({ ...actual, [campo]: valor }));
  }

  function validar(): DetalleValidacion[] {
    return OBLIGATORIOS.filter(({ campo }) => String(tarea[campo]).trim() === '').map(
      ({ campo, etiqueta }) => ({ campo, mensaje: `${etiqueta} es obligatorio.` }),
    );
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const faltantes = validar();
    setErroresLocales(faltantes);
    if (faltantes.length > 0) return;

    onGuardar({
      ...tarea,
      fechaCreacion: new Date(tarea.fechaCreacion).toISOString(),
    });
  }

  const aMostrar = [...errores, ...erroresLocales];
  const mensajeDe = (campo: string) =>
    aMostrar.filter((error) => error.campo === campo).map((error) => error.mensaje);
  const avisosSueltos = aMostrar.filter((error) => !CAMPOS_CON_ERROR_EN_LINEA.has(error.campo));

  return (
    <form className="formulario" onSubmit={enviar} noValidate>
      <h2>Nueva tarea</h2>

      {avisosSueltos.length > 0 && (
        <ul className="formulario__errores" role="alert">
          {avisosSueltos.map((error) => (
            <li key={`${error.campo}-${error.mensaje}`}>{error.mensaje}</li>
          ))}
        </ul>
      )}

      <div className="formulario__campos">
        <label htmlFor="nombreProyecto">
          Nombre del Proyecto
          <input
            id="nombreProyecto"
            type="text"
            maxLength={120}
            value={tarea.nombreProyecto}
            onChange={(evento) => cambiar('nombreProyecto', evento.target.value)}
          />
          {mensajeDe('nombreProyecto').map((mensaje) => (
            <span className="campo__error" key={mensaje}>
              {mensaje}
            </span>
          ))}
        </label>

        <label htmlFor="tipoActividad">
          Tipo de Actividad
          <select
            id="tipoActividad"
            value={tarea.tipoActividad}
            onChange={(evento) => cambiar('tipoActividad', evento.target.value as TipoActividad)}
          >
            {TIPOS_ACTIVIDAD.map((tipo) => (
              <option key={tipo} value={tipo}>
                {ETIQUETAS_TIPO_ACTIVIDAD[tipo]}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="estado">
          Estado
          <select
            id="estado"
            value={tarea.estado}
            onChange={(evento) => cambiar('estado', evento.target.value as Estado)}
          >
            {ESTADOS_EDITABLES.map((estado) => (
              <option key={estado} value={estado}>
                {ETIQUETAS_ESTADO[estado]}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="prioridad">
          Prioridad
          <select
            id="prioridad"
            value={tarea.prioridad}
            onChange={(evento) => cambiar('prioridad', evento.target.value as Prioridad)}
          >
            {PRIORIDADES.map((prioridad) => (
              <option key={prioridad} value={prioridad}>
                {ETIQUETAS_PRIORIDAD[prioridad]}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="resumen">
          Resumen
          <input
            id="resumen"
            type="text"
            maxLength={200}
            value={tarea.resumen}
            onChange={(evento) => cambiar('resumen', evento.target.value)}
          />
          {mensajeDe('resumen').map((mensaje) => (
            <span className="campo__error" key={mensaje}>
              {mensaje}
            </span>
          ))}
        </label>

        <label htmlFor="informador">
          Informador
          <input
            id="informador"
            type="text"
            maxLength={80}
            value={tarea.informador}
            onChange={(evento) => cambiar('informador', evento.target.value)}
          />
          {mensajeDe('informador').map((mensaje) => (
            <span className="campo__error" key={mensaje}>
              {mensaje}
            </span>
          ))}
        </label>

        <label htmlFor="personaAsignada">
          Persona asignada
          <input
            id="personaAsignada"
            type="text"
            maxLength={80}
            value={tarea.personaAsignada}
            onChange={(evento) => cambiar('personaAsignada', evento.target.value)}
          />
          {mensajeDe('personaAsignada').map((mensaje) => (
            <span className="campo__error" key={mensaje}>
              {mensaje}
            </span>
          ))}
        </label>

        <label htmlFor="sprint">
          Sprint
          <input
            id="sprint"
            type="text"
            maxLength={40}
            value={tarea.sprint}
            onChange={(evento) => cambiar('sprint', evento.target.value)}
          />
          {mensajeDe('sprint').map((mensaje) => (
            <span className="campo__error" key={mensaje}>
              {mensaje}
            </span>
          ))}
        </label>

        <label htmlFor="descripcion" className="campo--ancho">
          Descripción
          <textarea
            id="descripcion"
            rows={3}
            maxLength={5000}
            value={tarea.descripcion}
            onChange={(evento) => cambiar('descripcion', evento.target.value)}
          />
          {mensajeDe('descripcion').map((mensaje) => (
            <span className="campo__error" key={mensaje}>
              {mensaje}
            </span>
          ))}
        </label>

        <label htmlFor="precondicion" className="campo--ancho">
          Precondición
          <textarea
            id="precondicion"
            rows={2}
            maxLength={500}
            value={tarea.precondicion}
            onChange={(evento) => cambiar('precondicion', evento.target.value)}
          />
        </label>

        <label htmlFor="fechaCreacion">
          Fecha de Creación
          <input
            id="fechaCreacion"
            type="date"
            value={tarea.fechaCreacion}
            onChange={(evento) => cambiar('fechaCreacion', evento.target.value)}
          />
        </label>

        <label htmlFor="fechaCierre">
          Fecha de Cierre
          <input
            id="fechaCierre"
            type="date"
            value={fechaCierre ? fechaCierre.slice(0, 10) : ''}
            disabled
            readOnly
          />
        </label>
      </div>

      <div className="formulario__acciones">
        <button type="submit">{editando ? 'Guardar cambios' : 'Agregar tarea'}</button>
        {editando && (
          <button type="button" className="secundario" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

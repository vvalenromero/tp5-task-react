import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Tarea } from '../types/task';
import { TaskList } from './TaskList';

function tarea(extra: Partial<Tarea> = {}): Tarea {
  return {
    id: 'id-1',
    nombreProyecto: 'Portal de inscripciones',
    tipoActividad: 'feature',
    estado: 'nueva',
    resumen: 'Alta de postulantes',
    descripcion: 'Registra postulantes y valida el DNI.',
    prioridad: 'alta',
    informador: 'Ernesto Ledesma',
    personaAsignada: 'Valentin Romero',
    precondicion: '',
    fechaCreacion: '2026-10-01T10:00:00.000Z',
    fechaCierre: null,
    sprint: 'Sprint 4',
    ...extra,
  };
}

function renderListado(tareas: Tarea[]) {
  const onEditar = vi.fn();
  const onEliminar = vi.fn();
  const onFinalizar = vi.fn();

  render(
    <TaskList
      tareas={tareas}
      onEditar={onEditar}
      onEliminar={onEliminar}
      onFinalizar={onFinalizar}
    />,
  );

  return { onEditar, onEliminar, onFinalizar };
}

describe('TaskList', () => {
  it('lista las tareas en el componente "Listado de Tareas"', () => {
    renderListado([tarea(), tarea({ id: 'id-2', nombreProyecto: 'Backoffice de taller' })]);

    expect(screen.getByRole('heading', { name: 'Listado de Tareas' })).toBeInTheDocument();
    expect(screen.getByText('Portal de inscripciones')).toBeInTheDocument();
    expect(screen.getByText('Backoffice de taller')).toBeInTheDocument();
  });

  it('muestra un mensaje cuando todavía no hay tareas', () => {
    renderListado([]);

    expect(screen.getByText(/todavía no hay tareas/i)).toBeInTheDocument();
  });

  it('pide editar la tarea elegida', async () => {
    const { onEditar } = renderListado([tarea()]);

    await userEvent.click(screen.getByRole('button', { name: 'Editar' }));

    expect(onEditar).toHaveBeenCalledWith(expect.objectContaining({ id: 'id-1' }));
  });

  it('pide finalizar la tarea elegida', async () => {
    const { onFinalizar } = renderListado([tarea()]);

    await userEvent.click(screen.getByRole('button', { name: 'Finalizar' }));

    expect(onFinalizar).toHaveBeenCalledWith('id-1');
  });

  it('pide eliminar la tarea elegida', async () => {
    const { onEliminar } = renderListado([tarea()]);

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(onEliminar).toHaveBeenCalledWith('id-1');
  });

  it('deshabilita finalizar en una tarea ya cerrada y muestra su fecha de cierre', () => {
    renderListado([
      tarea({ estado: 'finalizada', fechaCierre: '2026-10-05T18:00:00.000Z' }),
    ]);

    expect(screen.getByRole('button', { name: 'Finalizar' })).toBeDisabled();
    expect(screen.getByText('05/10/2026')).toBeInTheDocument();
  });

  it('muestra el estado y la prioridad con etiquetas legibles', () => {
    renderListado([tarea({ estado: 'en_progreso', prioridad: 'critica' })]);

    expect(screen.getByText('En progreso')).toBeInTheDocument();
    expect(screen.getByText('Crítica')).toBeInTheDocument();
  });
});

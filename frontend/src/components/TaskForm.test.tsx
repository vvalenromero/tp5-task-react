import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TaskForm } from './TaskForm';
import type { TaskFormProps } from './TaskForm';
import { tareaVacia } from '../types/task';

/** Los doce campos que la consigna pide que tenga el formulario. */
const CAMPOS_DE_LA_CONSIGNA = [
  'Nombre del Proyecto',
  'Tipo de Actividad',
  'Estado',
  'Resumen',
  'Descripción',
  'Prioridad',
  'Informador',
  'Persona asignada',
  'Precondición',
  'Fecha de Creación',
  'Fecha de Cierre',
  'Sprint',
];

function renderFormulario(props: Partial<TaskFormProps> = {}) {
  const onGuardar = vi.fn();
  const onCancelar = vi.fn();

  render(
    <TaskForm
      valorInicial={tareaVacia()}
      onGuardar={onGuardar}
      onCancelar={onCancelar}
      {...props}
    />,
  );

  return { onGuardar, onCancelar };
}

async function completarObligatorios() {
  await userEvent.type(screen.getByLabelText('Nombre del Proyecto'), 'Portal de inscripciones');
  await userEvent.type(screen.getByLabelText('Resumen'), 'Alta de postulantes');
  await userEvent.type(screen.getByLabelText('Descripción'), 'Registra postulantes y valida el DNI.');
  await userEvent.type(screen.getByLabelText('Informador'), 'Ernesto Ledesma');
  await userEvent.type(screen.getByLabelText('Persona asignada'), 'Valentin Romero');
  await userEvent.type(screen.getByLabelText('Sprint'), 'Sprint 4');
}

describe('TaskForm', () => {
  it('renderiza los doce campos de la consigna', () => {
    renderFormulario();

    for (const campo of CAMPOS_DE_LA_CONSIGNA) {
      expect(screen.getByLabelText(campo), `falta el campo ${campo}`).toBeInTheDocument();
    }
  });

  it('no guarda si faltan campos obligatorios y avisa al usuario', async () => {
    const { onGuardar } = renderFormulario();

    await userEvent.click(screen.getByRole('button', { name: 'Agregar tarea' }));

    expect(onGuardar).not.toHaveBeenCalled();
    expect(await screen.findAllByText(/es obligatorio/i)).not.toHaveLength(0);
  });

  it('guarda la tarea completa con la fecha de creación en formato ISO', async () => {
    const { onGuardar } = renderFormulario();

    await completarObligatorios();
    await userEvent.selectOptions(screen.getByLabelText('Prioridad'), 'alta');
    await userEvent.click(screen.getByRole('button', { name: 'Agregar tarea' }));

    expect(onGuardar).toHaveBeenCalledTimes(1);
    expect(onGuardar.mock.calls[0][0]).toMatchObject({
      nombreProyecto: 'Portal de inscripciones',
      tipoActividad: 'feature',
      estado: 'nueva',
      prioridad: 'alta',
      informador: 'Ernesto Ledesma',
      personaAsignada: 'Valentin Romero',
      sprint: 'Sprint 4',
    });
    expect(onGuardar.mock.calls[0][0].fechaCreacion).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('en modo edición muestra las acciones de guardar cambios y cancelar', async () => {
    const { onCancelar } = renderFormulario({
      valorInicial: { ...tareaVacia(), nombreProyecto: 'Portal de inscripciones' },
      editando: true,
    });

    expect(screen.getByLabelText('Nombre del Proyecto')).toHaveValue('Portal de inscripciones');

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancelar).toHaveBeenCalledTimes(1);
  });

  it('no permite escribir la fecha de cierre: la sella la operación de finalizar', () => {
    renderFormulario();

    expect(screen.getByLabelText('Fecha de Cierre')).toBeDisabled();
  });

  it('muestra los errores de validación que devuelve el backend', () => {
    renderFormulario({
      errores: [{ campo: 'sprint', mensaje: 'El campo sprint es obligatorio.' }],
    });

    expect(screen.getByText('El campo sprint es obligatorio.')).toBeInTheDocument();
  });
});

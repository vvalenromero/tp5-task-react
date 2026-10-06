import { describe, expect, it } from 'vitest';

import {
  ESTADOS,
  PRIORIDADES,
  TIPOS_ACTIVIDAD,
  finalizar,
  validarActualizacion,
  validarCreacion,
} from '../../src/domain/task.js';

/** Payload valido minimo; cada test pisa solo lo que le interesa. */
const payloadValido = () => ({
  nombreProyecto: 'Portal de inscripciones',
  tipoActividad: 'feature',
  resumen: 'Alta de postulantes',
  descripcion: 'Formulario publico que registra postulantes y valida el DNI.',
  prioridad: 'alta',
  informador: 'Ernesto Ledesma',
  personaAsignada: 'Valentin Romero',
  precondicion: 'Tener el circuito de pagos cerrado',
  sprint: 'Sprint 4',
});

/** Devuelve los nombres de los campos marcados como invalidos. */
const camposInvalidos = (resultado) => resultado.detalles.map((detalle) => detalle.campo);

describe('catalogos del dominio', () => {
  it('expone los valores permitidos de cada enumerado', () => {
    expect(ESTADOS).toEqual(['nueva', 'en_progreso', 'bloqueada', 'en_revision', 'finalizada']);
    expect(PRIORIDADES).toEqual(['baja', 'media', 'alta', 'critica']);
    expect(TIPOS_ACTIVIDAD).toContain('feature');
    expect(TIPOS_ACTIVIDAD).toContain('bug');
  });
});

describe('validarCreacion', () => {
  it('acepta un payload completo y devuelve la tarea normalizada', () => {
    const resultado = validarCreacion(payloadValido());

    expect(resultado.ok).toBe(true);
    expect(resultado.task).toMatchObject({
      nombreProyecto: 'Portal de inscripciones',
      tipoActividad: 'feature',
      prioridad: 'alta',
      sprint: 'Sprint 4',
    });
    expect(resultado.task.id).toEqual(expect.any(String));
  });

  it('aplica los valores por defecto de los campos opcionales', () => {
    const { precondicion, ...sinPrecondicion } = payloadValido();

    const resultado = validarCreacion(sinPrecondicion);

    expect(resultado.ok).toBe(true);
    expect(resultado.task.estado).toBe('nueva');
    expect(resultado.task.precondicion).toBe('');
    expect(resultado.task.fechaCierre).toBeNull();
    expect(Number.isNaN(Date.parse(resultado.task.fechaCreacion))).toBe(false);
  });

  it('recorta los espacios sobrantes de los textos', () => {
    const resultado = validarCreacion({
      ...payloadValido(),
      nombreProyecto: '   Portal de inscripciones   ',
    });

    expect(resultado.ok).toBe(true);
    expect(resultado.task.nombreProyecto).toBe('Portal de inscripciones');
  });

  it('rechaza el alta cuando falta cada campo obligatorio', () => {
    const obligatorios = [
      'nombreProyecto',
      'tipoActividad',
      'resumen',
      'descripcion',
      'prioridad',
      'informador',
      'personaAsignada',
      'sprint',
    ];

    for (const campo of obligatorios) {
      const payload = payloadValido();
      delete payload[campo];

      const resultado = validarCreacion(payload);

      expect(resultado.ok, `se esperaba el rechazo por ${campo} ausente`).toBe(false);
      expect(resultado.code).toBe('VALIDACION');
      expect(camposInvalidos(resultado)).toContain(campo);
    }
  });

  it('trata un texto en blanco como campo ausente', () => {
    const resultado = validarCreacion({ ...payloadValido(), resumen: '    ' });

    expect(resultado.ok).toBe(false);
    expect(camposInvalidos(resultado)).toContain('resumen');
  });

  it('rechaza valores fuera de los enumerados', () => {
    const resultado = validarCreacion({
      ...payloadValido(),
      tipoActividad: 'charla',
      prioridad: 'urgentisima',
      estado: 'empezando',
    });

    expect(resultado.ok).toBe(false);
    expect(camposInvalidos(resultado)).toEqual(
      expect.arrayContaining(['tipoActividad', 'prioridad', 'estado']),
    );
  });

  it('rechaza textos que superan el largo maximo', () => {
    const resultado = validarCreacion({
      ...payloadValido(),
      nombreProyecto: 'x'.repeat(121),
      resumen: 'x'.repeat(201),
      informador: 'x'.repeat(81),
    });

    expect(resultado.ok).toBe(false);
    expect(camposInvalidos(resultado)).toEqual(
      expect.arrayContaining(['nombreProyecto', 'resumen', 'informador']),
    );
  });

  it('reporta todos los errores juntos en una sola respuesta', () => {
    const resultado = validarCreacion({ nombreProyecto: '', tipoActividad: 'charla' });

    expect(resultado.ok).toBe(false);
    expect(resultado.detalles.length).toBeGreaterThan(3);
    expect(resultado.detalles.every((detalle) => detalle.campo && detalle.mensaje)).toBe(true);
  });

  it('no permite nacer una tarea ya finalizada', () => {
    const resultado = validarCreacion({
      ...payloadValido(),
      estado: 'finalizada',
      fechaCierre: '2026-10-06T10:00:00.000Z',
    });

    expect(resultado.ok).toBe(false);
    expect(camposInvalidos(resultado)).toContain('fechaCierre');
  });
});

describe('validarActualizacion', () => {
  it('acepta una edicion valida', () => {
    const resultado = validarActualizacion({ ...payloadValido(), prioridad: 'critica' });

    expect(resultado.ok).toBe(true);
    expect(resultado.task.prioridad).toBe('critica');
  });

  it('obliga a finalizar por la operacion dedicada', () => {
    const resultado = validarActualizacion({ ...payloadValido(), estado: 'finalizada' });

    expect(resultado.ok).toBe(false);
    expect(camposInvalidos(resultado)).toContain('estado');
  });

  it('aplica la misma validacion de obligatorios que el alta', () => {
    const resultado = validarActualizacion({ ...payloadValido(), descripcion: '' });

    expect(resultado.ok).toBe(false);
    expect(camposInvalidos(resultado)).toContain('descripcion');
  });
});

describe('finalizar', () => {
  it('pasa la tarea a finalizada y sella la fecha de cierre', () => {
    const tarea = validarCreacion(payloadValido()).task;
    const momento = new Date('2026-10-06T18:30:00.000Z');

    const resultado = finalizar(tarea, momento);

    expect(resultado.ok).toBe(true);
    expect(resultado.task.estado).toBe('finalizada');
    expect(resultado.task.fechaCierre).toBe('2026-10-06T18:30:00.000Z');
    expect(resultado.task.fechaCreacion).toBe(tarea.fechaCreacion);
  });

  it('no vuelve a finalizar una tarea ya cerrada', () => {
    const tarea = finalizar(validarCreacion(payloadValido()).task, new Date()).task;

    const resultado = finalizar(tarea, new Date());

    expect(resultado.ok).toBe(false);
    expect(resultado.code).toBe('TAREA_YA_FINALIZADA');
  });
});

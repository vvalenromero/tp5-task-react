import { useCallback, useEffect, useState } from 'react';

import { apiTareas } from './api/tasks';
import type { DetalleValidacion } from './api/tasks';
import { ErrorApi } from './api/tasks';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { aEditable, tareaVacia } from './types/task';
import type { Tarea, TareaEditable } from './types/task';

function mensajeDe(error: unknown): string {
  if (error instanceof ErrorApi) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}

function detallesDe(error: unknown): DetalleValidacion[] {
  return error instanceof ErrorApi ? error.detalles : [];
}

export function App() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [enEdicion, setEnEdicion] = useState<Tarea | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [erroresDeCampo, setErroresDeCampo] = useState<DetalleValidacion[]>([]);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setTareas(await apiTareas.listar());
      setError(null);
    } catch (fallo) {
      setError(mensajeDe(fallo));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function guardar(datos: TareaEditable) {
    setGuardando(true);
    setErroresDeCampo([]);

    try {
      if (enEdicion) {
        await apiTareas.actualizar(enEdicion.id, datos);
      } else {
        await apiTareas.crear(datos);
      }
      setEnEdicion(null);
      setError(null);
      await cargar();
    } catch (fallo) {
      setErroresDeCampo(detallesDe(fallo));
      setError(mensajeDe(fallo));
    } finally {
      setGuardando(false);
    }
  }

  async function finalizar(id: string) {
    try {
      await apiTareas.finalizar(id);
      await cargar();
      setError(null);
    } catch (fallo) {
      setError(mensajeDe(fallo));
    }
  }

  async function eliminar(id: string) {
    try {
      await apiTareas.eliminar(id);
      if (enEdicion?.id === id) setEnEdicion(null);
      await cargar();
      setError(null);
    } catch (fallo) {
      setError(mensajeDe(fallo));
    }
  }

  return (
    <div className="app">
      <header className="app__cabecera">
        <h1>Manejador de tareas de proyectos</h1>
        <p>
          Trabajo Práctico — Programación Avanzada 2026 — FCyT · LISI
        </p>
      </header>

      {error && (
        <p className="app__error" role="alert">
          {error}
        </p>
      )}

      <main className="app__cuerpo">
        <TaskForm
          key={enEdicion?.id ?? 'nueva'}
          valorInicial={enEdicion ? aEditable(enEdicion) : tareaVacia()}
          fechaCierre={enEdicion?.fechaCierre ?? null}
          editando={enEdicion !== null}
          errores={erroresDeCampo}
          onGuardar={guardar}
          onCancelar={() => {
            setEnEdicion(null);
            setErroresDeCampo([]);
          }}
        />

        {guardando && <p className="app__estado">Guardando…</p>}

        {cargando ? (
          <p className="app__estado">Cargando tareas…</p>
        ) : (
          <TaskList
            tareas={tareas}
            onEditar={(tarea) => {
              setEnEdicion(tarea);
              setErroresDeCampo([]);
            }}
            onEliminar={eliminar}
            onFinalizar={finalizar}
          />
        )}
      </main>
    </div>
  );
}

export default App;

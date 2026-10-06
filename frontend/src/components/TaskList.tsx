import type { Tarea } from '../types/task';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tareas: Tarea[];
  onEditar: (tarea: Tarea) => void;
  onEliminar: (id: string) => void;
  onFinalizar: (id: string) => void;
}

export function TaskList({ tareas, onEditar, onEliminar, onFinalizar }: TaskListProps) {
  return (
    <section className="listado">
      <h2>Listado de Tareas</h2>

      {tareas.length === 0 ? (
        <p className="listado__vacio">
          Todavía no hay tareas cargadas. Cargá la primera con el formulario.
        </p>
      ) : (
        <ul className="listado__items">
          {tareas.map((tarea) => (
            <TaskItem
              key={tarea.id}
              tarea={tarea}
              onEditar={onEditar}
              onEliminar={onEliminar}
              onFinalizar={onFinalizar}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

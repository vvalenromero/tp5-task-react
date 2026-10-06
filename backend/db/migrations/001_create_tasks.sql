-- Tabla de tareas del TP5 "software project task manager".
-- La clave primaria uuid la genera Node (crypto.randomUUID), así que no hace
-- falta la extension pgcrypto.

CREATE TABLE IF NOT EXISTS tasks (
    id               uuid         PRIMARY KEY,
    nombre_proyecto  varchar(120) NOT NULL,
    tipo_actividad   varchar(20)  NOT NULL,
    estado           varchar(20)  NOT NULL DEFAULT 'nueva',
    resumen          varchar(200) NOT NULL,
    descripcion      text         NOT NULL,
    prioridad        varchar(10)  NOT NULL,
    informador       varchar(80)  NOT NULL,
    persona_asignada varchar(80)  NOT NULL,
    precondicion     varchar(500) NOT NULL DEFAULT '',
    fecha_creacion   timestamptz  NOT NULL DEFAULT now(),
    fecha_cierre     timestamptz,
    sprint           varchar(40)  NOT NULL,

    CONSTRAINT tasks_tipo_actividad_check CHECK (tipo_actividad IN (
        'feature', 'bug', 'refactor', 'documentacion',
        'pruebas', 'investigacion', 'despliegue', 'soporte'
    )),
    CONSTRAINT tasks_estado_check CHECK (estado IN (
        'nueva', 'en_progreso', 'bloqueada', 'en_revision', 'finalizada'
    )),
    CONSTRAINT tasks_prioridad_check CHECK (prioridad IN (
        'baja', 'media', 'alta', 'critica'
    )),
    -- Una tarea esta cerrada si y solo si tiene fecha de cierre.
    CONSTRAINT tasks_cierre_coherente_check CHECK (
        (estado = 'finalizada') = (fecha_cierre IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS tasks_estado_prioridad_idx ON tasks (estado, prioridad);
CREATE INDEX IF NOT EXISTS tasks_sprint_idx ON tasks (sprint);

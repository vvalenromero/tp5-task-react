# TP5 — Task React (manejador de tareas de proyectos de software)

Trabajo Práctico de **Programación Avanzada 2026** — FCyT � LISI (UADER).

Aplicación web para cargar tareas de un proyecto de software con los datos que
pide la consigna, listarlas y **editar**, **eliminar** o **finalizar** cada una.

## Requerimientos de la consigna y dónde se cumplen

| Requerimiento | Dónde |
| --- | --- |
| Formulario en **React con Vite** | `frontend/` (`vite.config.ts`, `src/components/TaskForm.tsx`) |
| La app tiene la lógica de negocio como **manejador de tareas** | `backend/src/domain/task.js` (validación y reglas de la tarea) + `src/routes/tasks.ts` |
| Los **12 campos** del formulario | `frontend/src/components/TaskForm.tsx`, `backend/db/migrations/001_create_tasks.sql` |
| Listado en el componente **"Listado de Tareas"** | `frontend/src/components/TaskList.tsx` |
| **Editar, eliminar y finalizar** la tarea | `frontend/src/components/TaskItem.tsx` + `PATCH /api/tasks/:id/finalizar` |
| Persistencia en **SQL / Postgres** | `backend/db/migrations/`, `backend/src/repositories/taskRepository.js` |
| **Frontend y backend en Docker** | `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile` |

### Los 12 campos

Nombre del Proyecto � Tipo de Actividad � Estado � Resumen � Descripción �
Prioridad � Informador � Persona asignada � Precondición � Fecha de Creación �
Fecha de Cierre � Sprint

*Fecha de Cierre* figura en el formulario como campo de sólo lectura: la asigna
la operación **Finalizar**, no se escribe a mano. Es la única libertad que nos
tomamos respecto del enunciado, y está cubierta por un test.

## Stack

- **Frontend:** React 19 + Vite + TypeScript, servido por nginx.
- **Backend:** Node.js + Express 5 en JavaScript ESM (sin transpilación).
- **Base de datos:** PostgreSQL 16.
- **Tests:** Vitest (+ supertest en el backend, + Testing Library en el frontend).

## Estructura

```
tp5-task-react/
├── backend/
│   ├── db/migrations/001_create_tasks.sql   esquema de la tabla tasks
│   ├── src/domain/task.js                   lógica de negocio (pura, testeada)
│   ├── src/db/                              pool de pg + runner de migraciones
│   ├── src/repositories/taskRepository.js   SQL y mapeo snake_case ↔ camelCase
│   ├── src/routes/tasks.js                  endpoints REST
│   ├── src/app.js                           app de Express (se exporta, no escucha)
│   ├── src/server.js                        migra y levanta el servidor
│   └── test/                                tests de dominio y de rutas
├── frontend/
│   ├── src/components/TaskForm.tsx          formulario de alta y edición
│   ├── src/components/TaskList.tsx          "Listado de Tareas"
│   ├── src/components/TaskItem.tsx          cada tarea + acciones
│   ├── src/api/tasks.ts                     cliente HTTP tipado
│   ├── src/types/task.ts                    campos, enums y etiquetas
│   └── nginx.conf                           sirve el bundle y proxya /api
├── docker-compose.yml
└── odd/tasks/tp5-task-react.md              seguimiento del trabajo
```

## Cómo levantarlo

### Con Docker (recomendado)

Requiere Docker en marcha.

```bash
docker compose up --build
```

Después: **http://localhost:8080**

Levanta tres contenedores:

| Servicio | Puerto en el host | Qué hace |
| --- | --- | --- |
| `frontend` | 8080 | nginx con el bundle de Vite; proxy `/api` → backend |
| `backend` | 3000 | API Express; aplica las migraciones al arrancar |
| `postgres` | 5433 | base `tp5` (5433 para no chocar con un Postgres local) |

El navegador siempre habla con rutas relativas `/api/...`: en Docker las resuelve
nginx, y en desarrollo el proxy de Vite. Nunca hay CORS de por medio.

Para bajarlo:

```bash
docker compose down          # conserva los datos
docker compose down -v       # borra también el volumen de Postgres
```

### En local, sin Docker

Backend (necesita un PostgreSQL accesible):

```bash
cd backend
npm install
npm test
npm start        # http://localhost:3000
```

Las migraciones de `backend/db/migrations/` se aplican solas en cada arranque, as�
que no hay que correr nada a mano. La cadena de conexión se toma de la variable
de entorno `DATABASE_URL` (por defecto, la de `docker-compose.yml`).

Frontend:

```bash
cd frontend
npm install
npm test
npm run dev      # http://localhost:5173, con proxy /api → localhost:3000
```

## API

Base: `/api`

| Método | Ruta | Qué hace |
| --- | --- | --- |
| `GET` | `/health` | Estado del servicio y de la base |
| `GET` | `/tasks` | Lista; acepta `estado`, `prioridad`, `sprint`, `personaAsignada` |
| `GET` | `/tasks/:id` | Una tarea |
| `POST` | `/tasks` | Crea (201) |
| `PUT` | `/tasks/:id` | Edita |
| `PATCH` | `/tasks/:id/finalizar` | Finaliza y sella la fecha de cierre |
| `DELETE` | `/tasks/:id` | Elimina (204) |

Errores: `400 VALIDACION` (con `detalles[{ campo, mensaje }]`),
`404 NO_ENCONTRADA`, `409 TAREA_YA_FINALIZADA` o
`TAREA_FINALIZADA_NO_EDITABLE`, `500 ERROR_INTERNO`.

Valores permitidos:

- **Tipo de Actividad:** `feature`, `bug`, `refactor`, `documentacion`, `pruebas`, `investigacion`, `despliegue`, `soporte`
- **Estado:** `nueva`, `en_progreso`, `bloqueada`, `en_revision`, `finalizada`
- **Prioridad:** `baja`, `media`, `alta`, `critica`

## Tests

```bash
cd backend  && npm test      # 31 tests
cd frontend && npm test      # 13 tests
cd frontend && npm run typecheck
```

En el backend, los tests de rutas inyectan un repositorio en memoria, as� que
**la suite entera pasa sin una base corriendo**. El SQL real se verifica aparte,
con `docker compose`.

## Decisiones de diseño

- **Validación a mano en el dominio.** Sin zod ni parecidos: la consigna pide la
  lógica de negocio como manejador de tareas, as� que `domain/task.js` es código
  propio, puro y testeable, y es la única fuente de verdad de las reglas.
- **Finalizar es una operación, no una edición.** `PUT` rechaza
  `estado: 'finalizada'`; el cierre pasa por `PATCH .../finalizar`, que es lo que
  llena `fecha_cierre`. La base lo refuerza con un `CHECK` que exige coherencia
  entre `estado` y `fecha_cierre`.
- **Backend en JavaScript ESM plano.** Node lo corre directo: la imagen Docker no
  necesita etapa de build ni transpilación.
- **El mapeo snake_case ↔ camelCase vive en un solo archivo** (el repositorio), as�
  que el resto de la app conoce una sola forma de la tarea.
- **Frontend servido por nginx**, con proxy `/api` al backend: se evita CORS en
  producción y se cumple el requisito de que el frontend esté en su contenedor.

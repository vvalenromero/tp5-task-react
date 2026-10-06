# TP5 — Task React

Manejador de tareas de proyectos de software. Trabajo Práctico de
**Programación Avanzada 2026** — FCyT · LISI (UADER).

## Qué hace

Permite cargar tareas de un proyecto de software con los datos que pide la
consigna, listarlas y **editar**, **eliminar** o **finalizar** cada una.

- **Frontend:** React + Vite (formulario de alta/edición y componente "Listado de Tareas").
- **Backend:** API REST en Express sobre PostgreSQL.
- **Docker:** frontend, backend y base de datos en contenedores.

## Campos de la tarea

Nombre del Proyecto · Tipo de Actividad · Estado · Resumen · Descripción ·
Prioridad · Informador · Persona asignada · Precondición · Fecha de Creación ·
Fecha de Cierre · Sprint

## Estructura

```
tp5-task-react/
├── backend/          API REST (Express + pg)
├── frontend/         Aplicación React + Vite
├── docker-compose.yml
└── odd/tasks/        Seguimiento de trabajo del proyecto
```

## Cómo levantarlo

### Con Docker (recomendado)

<!-- PENDIENTE: instrucciones definitivas de docker-compose (se completan al cerrar T8). -->

### Backend en local

```bash
cd backend
npm install
npm test          # suite de tests
npm start         # levanta la API en http://localhost:3000
```

Necesita una base PostgreSQL disponible en `DATABASE_URL` (ver `.env.example`).
Las migraciones de `backend/db/migrations/` se aplican solas al arrancar.

### Frontend en local

<!-- PENDIENTE: instrucciones del frontend (se completan al cerrar T8). -->

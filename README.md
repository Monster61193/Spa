# DanaeSpa — Monorepo de referencia multi-sucursal

Este repositorio reúne las piezas necesarias para ejecutar el sistema de citas del Spa con soporte multi-sucursal: documentación compartida, frontend (Vite + React), backend (NestJS + Prisma + PostgreSQL), bases de datos y QA.

## Estructura destacada
- `frontend/` → UI React + Vite con Axios, React Query, RHF+Zod, MSW y Playwright E2E.
- `backend/` → API NestJS con módulos por dominio (auth, branches, services, appointments, inventory, promotions, points, commissions, audit, notifications) y Prisma para PostgreSQL.
- `context/` → documentación viva (index, use cases, rules) más el PDF original y los diagramas.
- `db/` → `ddl_postgres.sql` (DDL extendido) y `erd.mmd`.
- `jira/issues.csv` → backlog inicial importable.
- `AGENTS.md` → reglas de estilo, documentación y multi-sucursal.

## Guía rápida
1. **Base de datos**: `psql -U postgres -f db/ddl_postgres.sql`; luego `cd backend && npm run prisma:generate && npm run prisma:seed`.
2. **Frontend**: `cd frontend && npm install`, luego `npm run dev` y la UI arranca en `http://localhost:4173`.
3. **Backend**: `cd backend && npm install`, luego `npm run start:dev` (expone `http://localhost:3000/api` con `X-Branch-Id` obligatorio).
4. **QA**: `cd frontend && npm run test:e2e` valida el flujo demo (reporte HTML en `frontend/playwright-report`).

## Registros
- MSW en `frontend/src/mocks/` simula sucursales, citas, inventario, promos y puntos.
- Playwright (`frontend/tests/`) cubre login demo → cambio de sucursal → validaciones visuales.
- Prisma seed (`backend/prisma/seed.ts`) precarga sucursales, servicios, promociones y stock según los mocks.

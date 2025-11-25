# Decisiones clave

1. El monorepo ahora contiene `frontend/`, `backend/`, `context/`, `db/` y `jira/` con una sola fuente de verdad en `context/`. La `documentacion` base se mantiene con referencias cruzadas en `AGENTS.md`.
2. El backend es un esqueleto NestJS + Prisma que expone los módulos solicitados y usa datos simulados/seed mientras no haya una base de datos real; `BranchGuard` valida `X-Branch-Id` y `RolesGuard` descifra `x-user-role`.
3. El frontend corre en Vite + React, usa Axios con `X-Branch-Id`, React Query para datos, MSW con datasets por sucursal y Playwright para smoke test (login → cambio de branch).
4. `db/ddl_postgres.sql` y `backend/prisma/schema.prisma` comparten el modelo de datos (sucursales, inventario, puntos, promociones, audit, comisiones). El seed de Prisma ilustra carga inicial.

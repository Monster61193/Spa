# DanaeSpa — Contexto del Proyecto (Multi‑Sucursal)

Este paquete contiene **toda la documentación base** para iniciar desde cero el sistema de **gestión de citas para Spa** con soporte **multi‑sucursal**.

## Contenido
- `AGENTS.md` — Reglas de colaboración y estilo (JSDoc, snake_case, SOLID, Clean Code).
- `context/index.md` — Resumen ejecutivo y alcance.
- `context/data_model.md` — Modelo de datos con entidades y relaciones.
- `context/api_contracts.md` — Contratos API (REST) y convenciones (incluye `X-Branch-Id`).
- `context/rbac.md` — Roles, permisos y políticas.
- `context/inventory_and_points_rules.md` — Reglas de negocio (inventario, puntos, promociones, comisiones).
- `context/multi_branch_delta.md` — Consideraciones multi‑sucursal (datos, API, UI, QA).
- `context/use_cases.md` — Historias de usuario y casos de uso.
- `context/roadmap.md` — Roadmap sugerido por fases.
- `context/diagrams/erd.mmd` — ERD en formato **Mermaid**.
- `database/schema.sql` — Script DDL **PostgreSQL** listo para ejecutar.
- `jira/issues.csv` — CSV inicial para importar a **Jira**.
- `frontend/eslint.config.js` — Config base de ESLint.
- `frontend/.prettierrc` — Reglas de formato.
- `.env.example` — Variables de entorno de ejemplo.

> Fecha de generación: 2025-11-24

## Uso rápido
1. **DB**: `psql -U postgres -f database/schema.sql`
2. **Jira**: importar `jira/issues.csv` (Issue Type, Epic/Story).
3. **Código**: usa `AGENTS.md` y los docs en `context/` como fuente de verdad.


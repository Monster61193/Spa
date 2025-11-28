# AGENTS.md — Reglas del Proyecto Danae Spa

- `context/Documentacion_Completa_Sistema_Citas.md` es la fuente maestra para alcance funcional y no funcional; complementa siempre con los otros archivos en `context/` (api_contracts, data_model, multi_branch_delta, rules_of_engagement, inventory_and_points_rules, etc.).
- Antes de agregar reglas nuevas, actualiza la documentación principal y referencia los contextos implicados para que la guía siga siendo única.

## Convenciones de código
- JSDoc obligatorio en cada clase, función exportada y handler. Usa comentarios breves que describan propósito o decisiones.
- `snake_case` para variables, funciones y constantes; `useXxx` (camelCase) para hooks; `PascalCase` para tipos, DTOs y componentes.
- Importa tipos con `import type` y evita traer implementaciones innecesarias.
- Las funciones deben ser pequeñas, enfocadas y predecibles (SRP).

## Principios SOLID y Clean Code
- SRP: cada módulo/fichero cumple una sola responsabilidad.
- OCP: extiende con adapters o policies sin modificar código estable.
- LSP: los subtipos deben comportarse como el tipo base.
- ISP: define interfaces específicas para consumidores.
- DIP: depende de abstracciones (gateways/services).
- Usa nombres claros, evita efectos secundarios y aplica DRY/KISS/YAGNI.
- Maneja errores uniformemente (_{ code, message, details? }_) y valida bordes con Zod, guardas, DTOs o pipes.
- Registra logs discretos y no expongas secretos.

## Multi-sucursal
- Cada request sensible exige `X-Branch-Id` y el backend lo valida con `BranchGuard/RolesGuard` antes de ejecutar handlers.
- Aplica `id_sucursal` en payloads cuando sea necesario (reassigns, auditoría) siempre sincronizado con el header.
- Las colecciones de datos por sucursal deben vivir en tablas como `servicios_sucursal`, `existencias`, `puntos_movimientos`, etc., y su lógica debe respetar anexos en `context/multi_branch_delta.md`.
- Documenta cualquier nueva regla multi-sucursal en `context/multi_branch_delta.md` y actualiza Swagger/contractos.

## Documentación & QA
- Actualiza `context/index.md` si los módulos o capacidades cambian (listado de módulos y KPIs).
- Usa `db/ddl_postgres.sql` y `db/erd.mmd` como referencia para definiciones de datos.
- MSW (`frontend/src/mocks/`) y Playwright (`frontend/tests/`) deben reflejar los datasets y flujos documentados.
- La base de datos en backend se describe en `backend/prisma/schema.prisma` y se sincroniza con `backend/prisma/seed.ts`.

## Lint, format y commits
- Frontend: ESLint Flat (`frontend/eslint.config.js`) y Prettier (`frontend/.prettierrc`). Backend: ESLint con `@typescript-eslint` y plugin JSDoc.
- Scripts: `npm run lint`, `npm run format`, `npm run test:e2e` (en frontend). Backend tiene `npm run lint`, `npm run format`, `npm run prisma:generate` y `npm run prisma:seed`.
- Commits deben seguir el formato `feat|fix|docs|refactor|test: mensaje`.

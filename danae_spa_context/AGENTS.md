# AGENTS.md — Reglas del Proyecto

- La documentación base es `context/Documentacion_Completa_Sistema_Citas.md`, que se complementa con los `context/*` (index, multi_branch_delta, rules_of_engagement, inventory_and_points_rules, api_contracts, data_model, rbac, etc.) para las reglas funcionales y no funcionales.
- Antes de proponer una nueva regla o flujo revisa esos contextos y actualiza la documentación principal para que siga siendo la fuente única del negocio.

## Convenciones del código
- JSDoc obligatorio antes de cada función exportada o invocada desde JSX (`@jsdoc/require-jsdoc` en ESLint).
- snake_case para variables, funciones, constantes y props; hooks `useXxx` (camelCase con prefijo `use`) y componentes/tipos en PascalCase.
- Siempre usa `import type` para importar tipos en TypeScript; evita los `import` que traen valores innecesarios.
- Mantén funciones pequeñas, claras y enfocadas en una sola responsabilidad (SRP).

## Principios SOLID
- SRP: cada módulo o función tiene un único motivo para cambiar (una sola responsabilidad).
- OCP: extiende con adapters o policies antes que modificar implementaciones existentes.
- LSP: cualquier subtipo o implementador debe comportarse como el tipo base esperado.
- ISP: las interfaces se diseñan para consumidores concretos, evitando contratos monolíticos.
- DIP: depende de abstracciones (gateways/services) y permite inyección de dependencias para desacoplar implementaciones.

## Clean Code & Calidad
- Nombres descriptivos (snake_case), funciones breves, evita efectos colaterales indeseados y respeta DRY/KISS/YAGNI.
- Valida bordes con Zod y maneja errores de forma uniforme; el gateway traduce `{ code, message, details? }` a toasts discretos.
- Registra logs útiles pero discretos; no expongas secretos ni sobrecargues la salida.
- Automáticamente separa commands (acciones) de queries (consultas) y escribe pruebas para la lógica crítica antes de desplegar.

## Multi-sucursal & Auditoría
- Todas las rutas sensibles reciben `X-Branch-Id`; los payloads pueden llevar `id_sucursal` y el backend debe gobernar la sucursal activa usando `usuarios_sucursales`.
- Los datos (servicios, materiales, promociones, puntos, comisiones, bitácoras) se aíslan por sucursal (`materiales_sucursal`, `servicios_overrides`, `puntos_usuarios`, `pagos_empleados`, `historial_actividades`, etc.).
- Audita acciones con `bitacora_citas` y `historial_actividades`; cada sucursal tiene trazabilidad propia de inventario y puntos.
- No rompas los contratos existentes: agrega `X-Branch-Id` y `id_sucursal` respetando la compatibilidad, y documenta las extensiones en `context/multi_branch_delta.md`.

## Documentación & Contexto
- `context/Documentacion_Completa_Sistema_Citas.md` es la fuente definitiva de alcances; compleméntala con `context/rules_of_engagement.md`, `context/multi_branch_delta.md`, `context/inventory_and_points_rules.md` y los demás contextos relevantes.
- Antes de introducir reglas nuevas, actualiza la documentación y agrega referencias cruzadas para evitar dispersión.
- Usa `Documentacion_Completa_Sistema_Citas.pdf` como referencia histórica y alinea cada ajuste con los modelos descritos en `context/data_model.md` y `context/rbac.md`.

## Lint & Format
- ESLint usa Flat Config en `eslint.config.js`; la regla `react-hooks/rules-of-hooks` es error y `react-hooks/exhaustive-deps` es warn.
- Prettier se configura en `.prettierrc`; mantén el código formateado con `npm run format`.
- `npm run lint` valida las reglas; `npm run format` corrige formatos.

## Commits
- Mensajes con prefijo `feat|fix|docs|refactor|test: ...`.

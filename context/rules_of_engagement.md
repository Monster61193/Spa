# Reglas de integración (cliente ↔ servidor)

## Versionado & contratos

- Contratos alineados con Swagger/OpenAPI; generar tipos cliente por script.
- Cambios breaking → `v2` con periodo de deprecación.

## Validaciones & errores

- Validar en servidor y **también** en cliente con Zod (fechas, estados, roles).
- Errores normalizados `{ code, message, details? }`; gateway mapea a toasts.
- Cada endpoint que afecta datos sensibles valida `X-Branch-Id` y la relación del usuario con `usuarios_sucursales`; se espera un header con la sucursal activa o un parámetro `id_sucursal`.

## Seguridad

- JWT de corta vida **en memoria**; refresh con cookie httpOnly.
- CORS: `credentials:true` y orígenes permitidos.
- Rate limiting en login/cierre de cita.

## Concurrencia

- `POST /appointments/close` **idempotente** (Idempotency-Key).
- Transacción atómica: cierre → inventario → puntos → comisiones → bitácora.
- Locks optimistas/pesimistas según necesidad.
- El proceso de cierre se ejecuta dentro del contexto de la sucursal (`id_sucursal` guardado en la sesión, header o parámetro), asegurando que el inventario y los punteros se actualicen sólo en esa sede.

## Datos

- Zona horaria de negocio; moneda **MXN**; decimales estándar.
- i18n/l10n: textos parametrizados; separar formato de presentación.

## DX & calidad

- snake_case + JSDoc obligatorios (AGENTS.md).
- MSW para mocks; Playwright para smoke E2E.
- CI: lint/test en PR; releases semánticos.
- Documentar todas las reglas de multi-sucursal en `/context/multi_branch_delta.md` y en Swagger; incluir tests de smoke que cubran login → selección de sucursal → agendar/cerrar.

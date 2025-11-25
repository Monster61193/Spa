# Delta multi-sucursal (multi_branch_delta)

## Índice

1. [Resumen & Objetivos](#1-resumen--objetivos)
2. [Alcance & Supuestos](#2-alcance--supuestos)
   2.1. [Nombres reservados y ejemplo de JSDoc](#21-nombres-reservados-y-ejemplo-de-jsdoc)
3. [Modelo de datos (delta)](#3-modelo-de-datos-delta)
4. [Contratos de API (delta)](#4-contratos-de-api-delta)
5. [Autenticación, autorización y tenancy](#5-autenticaci%C3%B3n-autorizaci%C3%B3n-y-tenancy)
6. [Frontend (delta)](#6-frontend-delta)
7. [Inventario & Puntos (reglas)](#7-inventario--puntos-reglas)
8. [Migraciones (DDL)](#8-migraciones-ddl)
9. [MSW (mocks)](#9-msw-mocks)
10. [Pruebas](#10-pruebas)
11. [Observabilidad & Auditoría](#11-observabilidad--auditor%C3%ADa)
12. [Plan de Rollout & Backout](#12-plan-de-rollout--backout)
13. [Checklist de aceptación](#13-checklist-de-aceptaci%C3%B3n)
14. [Glosario](#14-glosario)

## 1. Resumen & Objetivos

Detallar cómo el sistema abraza un modelo multi-sucursal (multitenant por branch) sin romper contratos ya definidos en `context/api_contracts.md`, `context/data_model.md`, `context/rbac.md`, `context/inventory_and_points_rules.md` ni en la fuente completa `context/Documentacion_Completa_Sistema_Citas.pdf`.

- Aísla datos por sucursal: cada consulta sensible debe filtrar por `X-Branch-Id` (header obligatorio) o `id_sucursal` en body.
- Permite overrides locales: precios/duración de servicios, stock y promociones pueden variar por sede.
- Ejecuta políticas globales vs específicas: promociones globales (`id_sucursal null`) y locales (`id_sucursal` igual a la sede activa); stock y puntos se contabilizan por sucursal pero pueden agregarse para reportes generales.
- Extiende comisiones y puntos por sucursal: se registran `puntos_usuarios` y `pagos_empleados` con `id_sucursal` para distribuir ganancias.
- No se rompe el contrato actual: añade `X-Branch-Id` y `id_sucursal` donde aplique, pero mantiene endpoints existentes y los enriquece con la nueva cabecera.

## 2. Alcance & Supuestos

- Frontend: Vite + React + TypeScript + AdminLTE 3 (CDN Bootstrap/jQuery) con TanStack Query v5, Axios (con interceptors que refrescan tokens desde `/auth/refresh`), React Hook Form + Zod, date-fns y clsx.
- Backend objetivo: NestJS + Prisma + PostgreSQL (aunque la implementación aún no exista, este documento define los contratos); se asume que los `modules` respetan la convención de `context/gateway.ts` como única fuente para `VITE_API_BASE_URL`.
- Infraestructura: cada request protegido lleva `Authorization: Bearer access_token` y `X-Branch-Id`; los interceptors guardan el token en memoria y usan cookies httpOnly para refresh.

### 2.1 Nombres reservados y ejemplo de JSDoc

- **snake_case**: funciones utilitarias, constantes, props y variables locales deben usar snake_case (ej. `const branch_storage`, `const form_values`).
- **PascalCase**: tipos/ interfaces/components (ej. `BranchContext`, `BranchFormValues`).
- **Hooks**: nombrar explícitamente como `useXxx` (camelCase con `use` + mayúscula) para que React los detecte (ej. `useBranchSelection`).
- **JSDoc** es obligatorio antes de cada función exportada o usada en JSX; por ejemplo:

```ts
/**
 * Construye una query key que incluye la sucursal activa para invalidaciones precisas.
 */
const qk = (base: string, ...rest: readonly string[]): readonly string[] => {
  return ["branch", base, ...rest];
};
```

## 3. Modelo de datos (delta)

1. Nuevas tablas y ajustes:
   - `sucursales` (UUID, nombre, direccion, tz, activa, created_at); su `nombre` es único y se usa en logs.
   - `usuarios_sucursales` (UUID usuario, UUID sucursal, rol_local, predeterminada bool, creado_en); combina RBAC local con visibilidad.
   - `materiales_sucursal` (UUID material, UUID sucursal, stock_actual numeric(12,2) default 0, stock_minimo numeric(12,2), actualizado_en timestamp) y se alimenta al cerrar citas.
   - `servicios_overrides` (UUID servicio, UUID sucursal, precio decimal, duracion integer, activo bool) para ajustar precio/duración por branch.
   - `promociones` mantiene `id_sucursal` nullable; se puede filtrar por `null` para global, por `branch` para local.
   - `puntos_usuarios` (UUID, id_usuario, id_cita, tipo enum, cantidad numeric, fecha, id_sucursal nullable) admite saldo global y por branch.
   - `citas` ahora incluye `id_sucursal` y `bitacoras` se registran con esa sucursal; se relaciona con `materiales_sucursal`, `promociones` y `puntos`.
2. Claves foráneas/constraints recomendadas:
   - `usuarios_sucursales(id_usuario) → usuarios(id)` y `id_sucursal → sucursales(id)` con `ON DELETE CASCADE` para evitar referencias huérfanas.
   - `materiales_sucursal(id_material) → materiales(id)` y `id_sucursal → sucursales(id)` con `UNIQUE(id_material, id_sucursal)`.
   - `servicios_overrides(id_servicio) → servicios(id)` y `id_sucursal → sucursales(id)` con `UNIQUE(id_servicio, id_sucursal)`.
   - `citas(id_promocion) → promociones(id)` y `id_sucursal → sucursales(id)`; `puntos_usuarios.id_cita → citas(id)`.
3. ERD ASCI:

```
usuarios ---< usuarios_sucursales >--- sucursales
          \                          /
           `- compras*/puntos ----> /
servicios ---< servicios_overrides
materiales ---< materiales_sucursal >--- sucursales
citas ---< bitacora_citas
citas --- puntos_usuarios
citas --- promociones
```

4. Lista breve de constraints:
   - `UNIQUE(usuarios_sucursales(id_usuario, id_sucursal))`
   - `UNIQUE(materiales_sucursal(id_material, id_sucursal))`
   - `UNIQUE(servicios_overrides(id_servicio, id_sucursal))`
   - `CHECK(stock_actual >= 0 OR allow_negative_stock = true)` (por política)
   - `CHECK(promociones.fecha_fin >= promociones.fecha_inicio)`

## 4. Contratos de API (delta)

- Header obligatorio: `X-Branch-Id` en todas las rutas sensibles; se agrega `id_sucursal` opcional en body, y en backend prevalece ese valor sobre el header cuando se envía (en especial para reassigns).
- Endpoints clave:
  | Método | Ruta | Query/Body | Respuesta esperada |
  | --- | --- | --- | --- |
  | GET | `/branches/mine` | ningún | 200 `{ data: [sucursal] }` (filtra por `usuarios_sucursales`). |
  | GET | `/materials/stock` | `id_material?`, `id_sucursal?` (override header) | 200 `{ stock_actual, stock_minimo, id_sucursal }`.
  | GET | `/appointments` | `desde`, `hasta`, `id_empleado`, `estado`, `id_sucursal?` | 200 con lista, 4xx si no pertenece a `X-Branch-Id`.
  | POST | `/appointments` | `id_usuario`, `id_empleado`, `id_servicio`, `id_promocion?`, `id_sucursal?`, `fecha_hora` | 200-201 `cita`, 400 si faltan permisos.
  | PATCH | `/appointments/{id}` | `estado`, `id_empleado?`, `motivo?`, `id_sucursal?` | 200 actualizado o 4xx si se intenta mover sin permiso.
  | POST | `/appointments/rebook` | `id_cita`, `nueva_fecha`, `id_sucursal?` | 200 cita reagendada.
  | POST | `/appointments/cancel` | `id_cita`, `motivo`, `id_sucursal?` | 200 cancelada.
  | POST | `/appointments/close` | `id_cita`, `id_promocion?`, `puntos_usar?`, `detalle_insumos[]`, `id_sucursal?` | 200 cierre, 409 si stock insuficiente.
  | GET | `/services` | `id_sucursal?`, `activo?` | 200 catálogo con override fusionado.
  | GET | `/services/overrides` | `id_servicio?`, `id_sucursal?` | 200 overrides.
  | POST | `/services/overrides` | `id_servicio`, `id_sucursal`, `precio`, `duracion` | 201 override.
  | GET | `/promotions` | `id_sucursal?`, `estado?` | 200 list.
  | GET | `/promotions/active` | `id_sucursal?` | 200 validas (global + branch). |
  | GET | `/points/balance` | `usuario_id`, `id_sucursal?` | 200 `{ saldo, id_sucursal }`.
  | GET | `/points/history` | `usuario_id`, `id_sucursal?`, `desde`, `hasta` | 200 movimiento.
- Reglas: el backend siempre valida que el `X-Branch-Id` esté dentro de los `usuarios_sucursales` del token; si se pasa `id_sucursal` en payload y el usuario no tiene rol sobre ella, se rechaza con 403.

## 5. Autenticación, autorización y tenancy

- RBAC: la matriz de `context/rbac.md` se extiende con awareness de sucursal; el token anual incluye `branch_assignments[]` y la sucursal activa.
- Guard: `BranchGuard` valida `X-Branch-Id` y `usuarios_sucursales` antes de ejecutar handlers.

```ts
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
/**
 * Valida que el usuario tenga acceso a la sucursal solicitada antes de ejecutar el handler.
 */
class BranchGuard implements CanActivate {
  constructor(
    private readonly usuarios_sucursales_gateway: UsuariosSucursalesGateway
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const branch_id = request.headers["x-branch-id"];
    const user_id = request.user?.id;
    if (!branch_id || !user_id) {
      return false;
    }
    return this.usuarios_sucursales_gateway.tiene_acceso(branch_id, user_id);
  }
}
```

- Visibilidad:
  - `admin`: todas las sucursales.
  - `recepcionista`: sucursal activa y alertas associadas.
  - `empleado`: citas donde es responsable dentro de la sucursal activa.
  - `usuario`: solo sus citas (`usuario_id`) y puntos vinculados a la sucursal.

## 6. Frontend (delta)

- **Axios interceptor**: el cliente central (`context/gateway.ts`) inyecta `X-Branch-Id` antes de cada request.

```ts
import { AxiosHeaders } from "axios";

api_client.interceptors.request.use((config) => {
  const active_branch_id = branch_store.get_active_branch_id();
  config.headers = config.headers ?? new AxiosHeaders();
  config.headers.set("X-Branch-Id", active_branch_id);
  return config;
});
```

- **Query keys**: se añaden `branch_id` al construir keys, evita cruces entre sucursales.

```ts
/**
 * Genera una query key incluyendo la sucursal activa para invalidación precisa.
 */
const qk = (base: string, ...rest: readonly string[]): readonly string[] => {
  const active_branch = branch_store.get_active_branch_id();
  return ["branch", active_branch, base, ...rest];
};
```

- **BranchProvider**: componente + hook para seleccionar sucursal y reiniciar cachés sensibles (TanStack Query `queryClient.invalidateQueries(['appointments'])`).
  - Exponer `BranchContext` con `BranchProvider` y hook `useBranchSelection`.
  - Al cambiar sucursal, limpiar queries de inventario, citas, promociones y puntos.
- **Forms RHF+Zod**: los formularios exigen `id_sucursal` y convierten valores numéricos con `z.coerce.number()`.

```ts
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const branch_form_schema = z.object({
  id_sucursal: z.string().min(1, "Seleccione una sucursal"),
  cantidad: z.string().min(1, "Ingrese cantidad"),
  precio_unitario: z.coerce.number().positive(),
});

type BranchFormValues = z.infer<typeof branch_form_schema>;

const form_methods = useForm<BranchFormValues, unknown, BranchFormValues>({
  resolver: zodResolver(branch_form_schema),
});

/**
 * Convierte una cadena a entero respetando base 10.
 */
const to_int = (value: string) => Number.parseInt(value, 10);

/**
 * Convierte una cadena a flotante manteniendo precisión de puntos.
 */
const to_float = (value: string) => Number.parseFloat(value);

const handle_submit: SubmitHandler<BranchFormValues> = (form_values) => {
  const payload = {
    id_sucursal: to_int(form_values.id_sucursal),
    cantidad: to_int(form_values.cantidad),
    precio_unitario: to_float(form_values.precio_unitario.toString()),
  };
  api_client.post("/materials/stock", payload);
};
```

- Patterns:
  - **Citas**: query `qk('appointments')`, formularios con `id_sucursal`, `to_int(form_values.id_sucursal)` en handlers.
  - **Servicios + overrides**: lista global en `useQuery(qk('services'))`; overrides en `qk('services', 'overrides')` y formularios `id_sucursal` + `z.coerce.number()`.
  - **Materiales/Stock**: stock local + alertas; al cerrar cita se llama PATCH con `id_sucursal` y `detalle_insumos[]`.
  - **Promociones**: `GET /promotions/active?id_sucursal=${branch}`; en formularios se selecciona sucursal activa.
  - **Puntos**: `useQuery(qk('points', 'balance', usuario_id))` y `qk('points', 'history')`; formularios de redención con `id_sucursal` select y validación `saldo >= puntos_usar`.

## 7. Inventario & Puntos (reglas)

- Reservas: al agendar se notifica (y se valida que `materiales_sucursal.stock_actual` sea suficiente) pero no se descuenta stock; `stock_actual` se reduce únicamente al cerrar.
- Cierres: el consumo real valida `materiales_sucursal.id_sucursal = cita.id_sucursal` y genera movimientos de inventario + `puntos_usuarios` (tipo `ganado`).
- Puntos: se acreditan al cerrar y se debitan al ser usados; balance por sucursal (filtrado por `id_sucursal`) y general.
- Promos válidas: `estado=true`, dentro de vigencia y `id_sucursal` es `null` o coincide con la sucursal; se aplica sobre el precio vigente (override si existe).

## 8. Migraciones (DDL)

- Ejemplo PostgreSQL:

```sql
CREATE TABLE sucursales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL UNIQUE,
  direccion TEXT,
  tz TEXT NOT NULL DEFAULT 'America/Mexico_City',
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE usuarios ADD COLUMN id_sucursal UUID;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_fk_sucursal FOREIGN KEY (id_sucursal) REFERENCES sucursales(id);

CREATE TABLE materiales_sucursal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_material UUID NOT NULL REFERENCES materiales(id) ON DELETE CASCADE,
  id_sucursal UUID NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
  stock_actual NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock_minimo NUMERIC(12,2) NOT NULL DEFAULT 0,
  actualizado_en TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE (id_material, id_sucursal)
);
```

- Plan seguro: 1) crear columnas/bandejas con `NULL`, 2) backfill desde operaciones existentes, 3) validar queries y APIs, 4) aplicar `NOT NULL` donde corresponda.

## 9. MSW (mocks)

- Handler ejemplo:

```ts
import { rest } from "msw";

const branch_datasets = {
  "1": {
    appointments: [{ id: "a1", estado: "pendiente", sucursal: "Principal" }],
  },
  "2": {
    appointments: [{ id: "a2", estado: "confirmado", sucursal: "Norte" }],
  },
};

/**
 * Retorna un dataset mock según el branch activo para los handlers MSW.
 */
const get_branch_dataset = (branch_id: string) =>
  branch_datasets[branch_id] ?? branch_datasets["1"];

export const appointments_handler = rest.get(
  `${process.env.VITE_API_BASE_URL}/appointments`,
  (req, res, ctx) => {
    const branch_id = req.headers.get("X-Branch-Id") ?? "1";
    const dataset = get_branch_dataset(branch_id);
    return res(ctx.status(200), ctx.json({ data: dataset.appointments }));
  }
);
```

- Cada handler debe leer el header `X-Branch-Id` y devolver datasets separados (`1=Principal`, `2=Norte`) para validar UI y pruebas unitarias.

## 10. Pruebas

1. Smoke: cambiar sucursal activa → consultas `/appointments`, `/inventory` y `/promotions/active` muestran datos distintos.
2. Cerrar cita → decrementa `materiales_sucursal`, acredita `puntos_usuarios`, actualiza `promociones` y registros de pagos.
3. Contratos: 4xx si se omite `X-Branch-Id`, 200 con shapes esperados y `id_sucursal` presente.
4. UI: selector de sucursal invalida queries y refresca datos críticos (citas, inventario, puntos).
5. Guards: `BranchGuard` rechaza si el usuario no pertenece a la sucursal solicitada.

## 11. Observabilidad & Auditoría

- Campos recomendados: `branch_id`, `user_id`, `role`, `evento`, `timestamp`, `contexto`.
- Logs de servicios, inventario y cierres deben incluir la sucursal (`branch_id`) y, cuando aplica, el `id_cita`.
- Auditoría: cada entidad crítica (citas, promociones, puntos) registra `created_by`, `branch_id` y `ip_address` si está disponible.

## 12. Plan de Rollout & Backout

1. Feature flag `multi_branch` en backend y frontend; se activa con un toggle en el dashboard de configuración.
2. Checklist despliegue:
   - Migraciones ejecutadas (DDL + backfill) en staging.
   - Tests de contrato y UI verdes.
   - Monitoreo de logs con filtro `branch_id` y alertas de errores 4xx por sucursal.
3. Backout: desactivar feature flag y volver a `main` de backend; no se eliminan columnas hasta validar rollback.

## 13. Checklist de aceptación

- [ ] Requests con `X-Branch-Id` y `id_sucursal` pasan por los endpoints listados.
- [ ] Query keys (`qk`) e interceptors en frontend respetan la sucursal activa.
- [ ] Formularios RHF+Zod incluyen `id_sucursal`, `z.coerce.number()` y `SubmitHandler` convierte valores.
- [ ] MSW mocks entregan datasets distintos por sucursal y el guard `BranchGuard` valida accesos.
- [ ] Migraciones DDL aplicadas sin pérdida de datos y con constraints correspondientes.
- [ ] `README.md` y `AGENTS.md` referencian este documento como fuente de verdad.

## 14. Glosario

- **branch**: sucursal física del spa; con `id_sucursal` y `X-Branch-Id` se aísla el scope.
- **override**: ajuste local del servicio (precio/duración) diseñado para una sucursal.
- **qk**: helper para construir query keys incluyendo `branch_id`.
- **BranchGuard**: guardia NestJS que valida el header y la asignación del usuario.
- **MSW**: mocks del frontend que simulan datasets por sucursal.

> Fuente ampliada: `context/Documentacion_Completa_Sistema_Citas.pdf` junto con los contextos (`index.md`, `api_contracts.md`, `data_model.md`, `rbac.md`, `inventory_and_points_rules.md`).

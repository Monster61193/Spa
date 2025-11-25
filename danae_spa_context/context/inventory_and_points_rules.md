# Reglas de negocio: inventario, promociones y puntos

## Inventario

1. **Agendar**: registrar **intención** de insumos sin tocar stock; se calcula si la sucursal tiene suficiente `materiales_sucursal.stock_actual`.
2. **Cerrar cita**: **descuento real** en `materiales_sucursal` de la sucursal activa. Si el stock es insuficiente:
   - Opción A: bloquear cierre (recomendado clave para consistencia multi-sucursal).
   - Opción B: permitir con stock negativo y generar incidencia (no recomendado sin un acuerdo explícito).
3. **Umbrales por sucursal**: alertas cuando `stock_actual ≤ stock_minimo` para cada sede (dashboard “Alertas de Stock” muestra sede y materials asociados).

## Promociones

- Válidas si `estado=true`, `fecha_inicio ≤ now ≤ fecha_fin` y (`id_sucursal null` o igual a la sucursal de la cita).
- Descuento aplicado sobre el **precio del servicio** vigente para la sucursal (override si existe).
- Reporte: conteo de citas por sucursal y total descontado, respetando el filtro `id_sucursal`.

## Puntos

- **Generación**: al **cerrar** cita se crea un movimiento con `id_sucursal`; `puntos_ganados = floor(precio_pagado * factor)` y se registra la sede.
- **Uso**: el cliente puede pagar con puntos de una sucursal específica o global; se registra `tipo='usado'` y `id_sucursal` para mantener trazabilidad.
- **Saldo neto** = `Σ(ganado) - Σ(usado)` y puede consultarse con filtro `id_sucursal` o en total general.
- **Orden de aplicación** (al cerrar):
  1. Promoción → descuento válido para la sucursal
  2. Uso de puntos → reduce total a pagar por la sucursal
  3. **Comisiones** sobre **importe pagado**
- **Redondeos**: precisión 2 decimales y su efecto en puntos aplica por sucursal y global.

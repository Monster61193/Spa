
Casos de Uso (UML textual)
UC-CIT-01 — Agendar cita
Actores: Recepcionista. Pre: usuario reg., sucursal activa.
Flujo: fecha/hora → servicio → empleado → pago/anticipo → usar puntos → validar → crear PENDIENTE → notificar.
Post: cita pendiente; alerta inventario.

UC-CIT-04 — Cerrar cita
Actores: Recepcionista/Empleado. Flujo: confirmar servicio → descontar inventario → registrar comisiones (sucursal/empleado) → generar puntos → cerrar.
Post: cita cerrada; movimientos/bitácora.

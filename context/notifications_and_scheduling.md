# Notificaciones & scheduling

## Canales

- Email (MailHog en dev), push (futuro), in-app.

## Eventos principales

- **Asignación de cita**: notificar a empleado.
- **Recordatorio**: cliente y recepción X horas antes (configurable).

## Scheduling

- `@nestjs/schedule` o cola (BullMQ) para jobs:
  - Escanear próximas citas dentro de ventana configurable.
  - Reintentos y backoff.

## Plantillas

- Variables: `{cliente}`, `{empleado}`, `{servicio}`, `{fecha_hora}`, `{sucursal?}`.
- Localización: es-MX por defecto; preparar i18n.

## Auditoría

- Registrar envíos y fallos en `historial_actividades` o tabla dedicada.

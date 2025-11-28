# API (REST)
Headers: Authorization, **X-Branch-Id**.
Auth: POST /auth/login; GET /auth/me
Branches: GET /branches/mine
Citas: GET/POST/PATCH /appointments, POST /appointments/:id/close
Servicios, Materiales/Inventario, Promociones, Puntos, Pagos.
Error estándar: {"error":{code,message,details}}.

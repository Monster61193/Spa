-- DDL extendido para Sistema de Citas Spa
-- Incluye multi-sucursal, puntos, promociones y auditoría

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE cita_estado AS ENUM ('pendiente','confirmada','cancelada','cerrada');
CREATE TYPE movimiento_tipo AS ENUM ('earn','redeem');

CREATE TABLE sucursales (
  id_sucursal UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT UNIQUE NOT NULL,
  zona_horaria TEXT NOT NULL DEFAULT 'America/Mexico_City',
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
  id_rol SERIAL PRIMARY KEY,
  nombre TEXT UNIQUE NOT NULL,
  descripcion TEXT
);

CREATE TABLE usuarios (
  id_usuario UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usuarios_roles (
  usuario_id UUID REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  rol_id INT REFERENCES roles(id_rol) ON DELETE CASCADE,
  id_sucursal UUID REFERENCES sucursales(id_sucursal) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, rol_id, id_sucursal)
);

CREATE TABLE empleados (
  id_empleado UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario UUID REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  porcentaje_comision NUMERIC(5,2) DEFAULT 0,
  activo BOOLEAN DEFAULT TRUE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE empleados_sucursales (
  id_empleado UUID REFERENCES empleados(id_empleado) ON DELETE CASCADE,
  id_sucursal UUID REFERENCES sucursales(id_sucursal) ON DELETE CASCADE,
  rol_local TEXT NOT NULL,
  predeterminada BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (id_empleado, id_sucursal)
);

CREATE TABLE servicios (
  id_servicio UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio_base NUMERIC(12,2) NOT NULL,
  duracion_minutos INT NOT NULL,
  activo BOOLEAN DEFAULT TRUE
);

CREATE TABLE servicios_sucursal (
  id_servicio UUID REFERENCES servicios(id_servicio) ON DELETE CASCADE,
  id_sucursal UUID REFERENCES sucursales(id_sucursal) ON DELETE CASCADE,
  precio NUMERIC(12,2) NOT NULL,
  duracion_minutos INT NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (id_servicio, id_sucursal)
);

CREATE TABLE materiales (
  id_material UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  unidad TEXT NOT NULL,
  costo_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE existencias (
  id_sucursal UUID REFERENCES sucursales(id_sucursal) ON DELETE CASCADE,
  id_material UUID REFERENCES materiales(id_material) ON DELETE CASCADE,
  stock_actual NUMERIC(12,4) DEFAULT 0,
  stock_minimo NUMERIC(12,4) DEFAULT 0,
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_sucursal, id_material)
);

CREATE TABLE servicios_materiales (
  id_servicio UUID REFERENCES servicios(id_servicio) ON DELETE CASCADE,
  id_material UUID REFERENCES materiales(id_material) ON DELETE RESTRICT,
  cantidad NUMERIC(12,4) NOT NULL CHECK (cantidad >= 0),
  PRIMARY KEY (id_servicio, id_material)
);

CREATE TABLE promociones (
  id_promocion UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  descuento NUMERIC(5,2) NOT NULL CHECK (descuento >= 0 AND descuento <= 100),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado BOOLEAN DEFAULT TRUE,
  id_sucursal UUID REFERENCES sucursales(id_sucursal),
  tipo TEXT NOT NULL
);

CREATE TABLE promociones_servicios (
  id_promocion UUID REFERENCES promociones(id_promocion) ON DELETE CASCADE,
  id_servicio UUID REFERENCES servicios(id_servicio) ON DELETE CASCADE,
  PRIMARY KEY (id_promocion, id_servicio)
);

CREATE TABLE citas (
  id_cita UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario UUID REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
  id_empleado UUID REFERENCES empleados(id_empleado) ON DELETE SET NULL,
  id_sucursal UUID REFERENCES sucursales(id_sucursal) ON DELETE CASCADE,
  id_servicio UUID REFERENCES servicios(id_servicio),
  id_promocion UUID REFERENCES promociones(id_promocion),
  fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
  estado cita_estado NOT NULL DEFAULT 'pendiente',
  total NUMERIC(12,2) DEFAULT 0,
  anticipo NUMERIC(12,2) DEFAULT 0,
  notas TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE promociones_aplicadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_cita UUID REFERENCES citas(id_cita) ON DELETE CASCADE,
  id_promocion UUID REFERENCES promociones(id_promocion),
  porcentaje_aplicado NUMERIC(5,2),
  monto_descontado NUMERIC(12,2),
  aplicado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE puntos_movimientos (
  id_movimiento UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario UUID REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_sucursal UUID REFERENCES sucursales(id_sucursal) ON DELETE CASCADE,
  id_cita UUID REFERENCES citas(id_cita) ON DELETE CASCADE,
  tipo movimiento_tipo NOT NULL,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comisiones (
  id_comision UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_empleado UUID REFERENCES empleados(id_empleado) ON DELETE CASCADE,
  id_cita UUID REFERENCES citas(id_cita) ON DELETE CASCADE,
  porcentaje NUMERIC(5,2) NOT NULL,
  monto NUMERIC(12,2) NOT NULL,
  generado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE liquidaciones (
  id_liquidacion UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_empleado UUID REFERENCES empleados(id_empleado) ON DELETE CASCADE,
  periodo_inicio DATE NOT NULL,
  periodo_fin DATE NOT NULL,
  monto_total NUMERIC(14,2) NOT NULL,
  generado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE liquidaciones_comisiones (
  id_liquidacion UUID REFERENCES liquidaciones(id_liquidacion) ON DELETE CASCADE,
  id_comision UUID REFERENCES comisiones(id_comision) ON DELETE CASCADE,
  PRIMARY KEY (id_liquidacion, id_comision)
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario UUID REFERENCES usuarios(id_usuario),
  id_sucursal UUID REFERENCES sucursales(id_sucursal),
  entidad TEXT NOT NULL,
  accion TEXT NOT NULL,
  descripcion TEXT,
  metadata JSONB,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_usuario UUID REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  id_sucursal UUID REFERENCES sucursales(id_sucursal),
  tipo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ausencias_empleado (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_empleado UUID REFERENCES empleados(id_empleado) ON DELETE CASCADE,
  inicio DATE NOT NULL,
  fin DATE NOT NULL,
  motivo TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices útiles
CREATE INDEX idx_citas_estado_fecha ON citas (estado, fecha_hora);
CREATE INDEX idx_citas_sucursal ON citas (id_sucursal);
CREATE INDEX idx_puntos_usuario_sucursal ON puntos_movimientos (id_usuario, id_sucursal);
CREATE INDEX idx_existencias_sucursal ON existencias (id_sucursal);
CREATE INDEX idx_notificaciones_usuario ON notificaciones (id_usuario, leida);
CREATE INDEX idx_audit_sucursal ON audit_log (id_sucursal);
CREATE INDEX idx_comisiones_empleado ON comisiones (id_empleado);
CREATE INDEX idx_liquidaciones_empleado ON liquidaciones (id_empleado);

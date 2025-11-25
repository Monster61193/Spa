-- DDL resumido (ver conversación)
create table if not exists sucursales(
  id_sucursal serial primary key,
  nombre text not null,
  activo boolean default true
);
create table if not exists usuarios(
  id_usuario serial primary key,
  nombre text not null,
  email text unique not null,
  tipo text not null
);
create table if not exists empleados(
  id_empleado serial primary key,
  id_usuario int references usuarios(id_usuario),
  porcentaje_comision numeric(5,2) default 0
);
create table if not exists materiales(
  id_material serial primary key,
  nombre text not null,
  unidad text not null,
  costo_unitario numeric(12,2) default 0
);
create table if not exists existencias(
  id_sucursal int references sucursales(id_sucursal),
  id_material int references materiales(id_material),
  stock_actual numeric(14,3) default 0,
  stock_minimo numeric(14,3) default 0,
  primary key(id_sucursal,id_material)
);
create table if not exists servicios(
  id_servicio serial primary key,
  nombre text not null,
  precio_base numeric(12,2) not null,
  duracion_minutos int not null
);
create table if not exists servicios_materiales(
  id_servicio int references servicios(id_servicio),
  id_material int references materiales(id_material),
  cantidad_estimada numeric(14,3) not null,
  primary key(id_servicio,id_material)
);
create table if not exists promociones(
  id_promocion serial primary key,
  nombre text not null,
  tipo text not null,
  valor numeric(12,2) not null,
  fecha_inicio date not null,
  fecha_fin date not null,
  estado text default 'activa'
);
create table if not exists promociones_servicios(
  id_promocion int references promociones(id_promocion),
  id_servicio int references servicios(id_servicio),
  primary key(id_promocion,id_servicio)
);
create table if not exists citas(
  id_cita serial primary key,
  id_usuario int references usuarios(id_usuario),
  id_empleado int references empleados(id_empleado),
  id_sucursal int references sucursales(id_sucursal),
  id_servicio int references servicios(id_servicio),
  fecha date not null,
  hora time not null,
  estado text default 'pendiente',
  total numeric(12,2) default 0,
  anticipo numeric(12,2) default 0,
  id_promocion_aplicada int references promociones(id_promocion)
);
create table if not exists puntos_usuarios_ledger(
  id serial primary key,
  id_usuario int references usuarios(id_usuario),
  id_sucursal int references sucursales(id_sucursal),
  id_cita int references citas(id_cita),
  tipo text not null,
  cantidad int not null,
  fecha timestamp default now()
);

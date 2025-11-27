-- CreateEnum
CREATE TYPE "CitaEstado" AS ENUM ('pendiente', 'confirmada', 'cancelada', 'cerrada');

-- CreateEnum
CREATE TYPE "MovimientoTipo" AS ENUM ('earn', 'redeem');

-- CreateTable
CREATE TABLE "sucursales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "zonaHoraria" TEXT NOT NULL DEFAULT 'America/Mexico_City',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_roles" (
    "usuarioId" TEXT NOT NULL,
    "rolId" INTEGER NOT NULL,
    "sucursalId" TEXT NOT NULL,

    CONSTRAINT "usuarios_roles_pkey" PRIMARY KEY ("usuarioId","rolId","sucursalId")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "porcentajeComision" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados_sucursales" (
    "empleadoId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "rolLocal" TEXT NOT NULL,
    "predeterminada" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "empleados_sucursales_pkey" PRIMARY KEY ("empleadoId","sucursalId")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioBase" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "duracionMinutos" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios_sucursal" (
    "servicioId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "precio" DECIMAL(65,30) NOT NULL,
    "duracionMinutos" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "servicios_sucursal_pkey" PRIMARY KEY ("servicioId","sucursalId")
);

-- CreateTable
CREATE TABLE "materiales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidad" TEXT NOT NULL,
    "costoUnitario" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "materiales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "existencias" (
    "sucursalId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "stockActual" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "stockMinimo" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "existencias_pkey" PRIMARY KEY ("sucursalId","materialId")
);

-- CreateTable
CREATE TABLE "servicios_materiales" (
    "servicioId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "cantidad" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "servicios_materiales_pkey" PRIMARY KEY ("servicioId","materialId")
);

-- CreateTable
CREATE TABLE "promociones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "descuento" DECIMAL(65,30) NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "sucursalId" TEXT,
    "tipo" TEXT NOT NULL,

    CONSTRAINT "promociones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promociones_servicios" (
    "promocionId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,

    CONSTRAINT "promociones_servicios_pkey" PRIMARY KEY ("promocionId","servicioId")
);

-- CreateTable
CREATE TABLE "citas" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "empleadoId" TEXT,
    "sucursalId" TEXT NOT NULL,
    "servicioId" TEXT,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "estado" "CitaEstado" NOT NULL DEFAULT 'pendiente',
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "anticipo" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "citas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promociones_aplicadas" (
    "id" TEXT NOT NULL,
    "citaId" TEXT NOT NULL,
    "promocionId" TEXT,
    "porcentajeAplicado" DECIMAL(65,30),
    "montoDescontado" DECIMAL(65,30),
    "aplicadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promociones_aplicadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puntos_movimientos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "citaId" TEXT NOT NULL,
    "tipo" "MovimientoTipo" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "puntos_movimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comisiones" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "citaId" TEXT NOT NULL,
    "porcentaje" DECIMAL(65,30) NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "generadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comisiones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidaciones" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "periodoFin" TIMESTAMP(3) NOT NULL,
    "montoTotal" DECIMAL(65,30) NOT NULL,
    "generadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "liquidaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidaciones_comisiones" (
    "liquidacionId" TEXT NOT NULL,
    "comisionId" TEXT NOT NULL,

    CONSTRAINT "liquidaciones_comisiones_pkey" PRIMARY KEY ("liquidacionId","comisionId")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "sucursalId" TEXT,
    "entidad" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "descripcion" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ausencias_empleado" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ausencias_empleado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sucursales_nombre_key" ON "sucursales"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_usuarioId_key" ON "empleados"("usuarioId");

-- CreateIndex
CREATE INDEX "promociones_sucursalId_idx" ON "promociones"("sucursalId");

-- CreateIndex
CREATE INDEX "citas_usuarioId_idx" ON "citas"("usuarioId");

-- CreateIndex
CREATE INDEX "citas_empleadoId_idx" ON "citas"("empleadoId");

-- CreateIndex
CREATE INDEX "citas_sucursalId_idx" ON "citas"("sucursalId");

-- CreateIndex
CREATE INDEX "citas_servicioId_idx" ON "citas"("servicioId");

-- CreateIndex
CREATE INDEX "citas_fechaHora_idx" ON "citas"("fechaHora");

-- CreateIndex
CREATE INDEX "promociones_aplicadas_citaId_idx" ON "promociones_aplicadas"("citaId");

-- CreateIndex
CREATE INDEX "promociones_aplicadas_promocionId_idx" ON "promociones_aplicadas"("promocionId");

-- CreateIndex
CREATE INDEX "puntos_movimientos_usuarioId_idx" ON "puntos_movimientos"("usuarioId");

-- CreateIndex
CREATE INDEX "puntos_movimientos_sucursalId_idx" ON "puntos_movimientos"("sucursalId");

-- CreateIndex
CREATE INDEX "puntos_movimientos_citaId_idx" ON "puntos_movimientos"("citaId");

-- CreateIndex
CREATE INDEX "comisiones_empleadoId_idx" ON "comisiones"("empleadoId");

-- CreateIndex
CREATE INDEX "comisiones_citaId_idx" ON "comisiones"("citaId");

-- CreateIndex
CREATE INDEX "liquidaciones_empleadoId_idx" ON "liquidaciones"("empleadoId");

-- CreateIndex
CREATE INDEX "audit_log_usuarioId_idx" ON "audit_log"("usuarioId");

-- CreateIndex
CREATE INDEX "audit_log_sucursalId_idx" ON "audit_log"("sucursalId");

-- CreateIndex
CREATE INDEX "notificaciones_usuarioId_idx" ON "notificaciones"("usuarioId");

-- CreateIndex
CREATE INDEX "ausencias_empleado_empleadoId_idx" ON "ausencias_empleado"("empleadoId");

-- AddForeignKey
ALTER TABLE "usuarios_roles" ADD CONSTRAINT "usuarios_roles_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_roles" ADD CONSTRAINT "usuarios_roles_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_roles" ADD CONSTRAINT "usuarios_roles_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados_sucursales" ADD CONSTRAINT "empleados_sucursales_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados_sucursales" ADD CONSTRAINT "empleados_sucursales_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios_sucursal" ADD CONSTRAINT "servicios_sucursal_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios_sucursal" ADD CONSTRAINT "servicios_sucursal_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "existencias" ADD CONSTRAINT "existencias_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "existencias" ADD CONSTRAINT "existencias_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materiales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios_materiales" ADD CONSTRAINT "servicios_materiales_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios_materiales" ADD CONSTRAINT "servicios_materiales_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "materiales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promociones_servicios" ADD CONSTRAINT "promociones_servicios_promocionId_fkey" FOREIGN KEY ("promocionId") REFERENCES "promociones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promociones_servicios" ADD CONSTRAINT "promociones_servicios_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas" ADD CONSTRAINT "citas_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promociones_aplicadas" ADD CONSTRAINT "promociones_aplicadas_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "citas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promociones_aplicadas" ADD CONSTRAINT "promociones_aplicadas_promocionId_fkey" FOREIGN KEY ("promocionId") REFERENCES "promociones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puntos_movimientos" ADD CONSTRAINT "puntos_movimientos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puntos_movimientos" ADD CONSTRAINT "puntos_movimientos_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puntos_movimientos" ADD CONSTRAINT "puntos_movimientos_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "citas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comisiones" ADD CONSTRAINT "comisiones_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comisiones" ADD CONSTRAINT "comisiones_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "citas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidaciones" ADD CONSTRAINT "liquidaciones_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidaciones_comisiones" ADD CONSTRAINT "liquidaciones_comisiones_liquidacionId_fkey" FOREIGN KEY ("liquidacionId") REFERENCES "liquidaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidaciones_comisiones" ADD CONSTRAINT "liquidaciones_comisiones_comisionId_fkey" FOREIGN KEY ("comisionId") REFERENCES "comisiones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ausencias_empleado" ADD CONSTRAINT "ausencias_empleado_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the column `createdAt` on the `audit_log` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `ausencias_empleado` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `citas` table. All the data in the column will be lost.
  - You are about to drop the column `fechaHora` on the `citas` table. All the data in the column will be lost.
  - The `estado` column on the `citas` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `generadoEn` on the `comisiones` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `empleados` table. All the data in the column will be lost.
  - You are about to drop the column `porcentajeComision` on the `empleados` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `empleados` table. All the data in the column will be lost.
  - You are about to drop the column `rolLocal` on the `empleados_sucursales` table. All the data in the column will be lost.
  - You are about to drop the column `stockActual` on the `existencias` table. All the data in the column will be lost.
  - You are about to drop the column `stockMinimo` on the `existencias` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `existencias` table. All the data in the column will be lost.
  - You are about to drop the column `generadoEn` on the `liquidaciones` table. All the data in the column will be lost.
  - You are about to drop the column `montoTotal` on the `liquidaciones` table. All the data in the column will be lost.
  - You are about to drop the column `periodoFin` on the `liquidaciones` table. All the data in the column will be lost.
  - You are about to drop the column `periodoInicio` on the `liquidaciones` table. All the data in the column will be lost.
  - You are about to drop the column `costoUnitario` on the `materiales` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `notificaciones` table. All the data in the column will be lost.
  - You are about to drop the column `fechaFin` on the `promociones` table. All the data in the column will be lost.
  - You are about to drop the column `fechaInicio` on the `promociones` table. All the data in the column will be lost.
  - You are about to drop the column `aplicadoEn` on the `promociones_aplicadas` table. All the data in the column will be lost.
  - You are about to drop the column `montoDescontado` on the `promociones_aplicadas` table. All the data in the column will be lost.
  - You are about to drop the column `porcentajeAplicado` on the `promociones_aplicadas` table. All the data in the column will be lost.
  - You are about to drop the column `duracionMinutos` on the `servicios` table. All the data in the column will be lost.
  - You are about to drop the column `precioBase` on the `servicios` table. All the data in the column will be lost.
  - You are about to drop the column `duracionMinutos` on the `servicios_sucursal` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `sucursales` table. All the data in the column will be lost.
  - You are about to drop the column `zonaHoraria` on the `sucursales` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `usuarios` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[usuario_id]` on the table `empleados` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fecha_hora` to the `citas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usuario_id` to the `empleados` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rol_local` to the `empleados_sucursales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `existencias` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monto_total` to the `liquidaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodo_fin` to the `liquidaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodo_inicio` to the `liquidaciones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fecha_fin` to the `promociones` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fecha_inicio` to the `promociones` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `tipo` on the `puntos_movimientos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `duracion_minutos` to the `servicios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duracion_minutos` to the `servicios_sucursal` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "cita_estado" AS ENUM ('pendiente', 'confirmada', 'cancelada', 'cerrada');

-- CreateEnum
CREATE TYPE "movimiento_tipo" AS ENUM ('earn', 'redeem');

-- DropForeignKey
ALTER TABLE "empleados" DROP CONSTRAINT "empleados_usuarioId_fkey";

-- DropIndex
DROP INDEX "citas_fechaHora_idx";

-- DropIndex
DROP INDEX "empleados_usuarioId_key";

-- AlterTable
ALTER TABLE "audit_log" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ausencias_empleado" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "citas" DROP COLUMN "createdAt",
DROP COLUMN "fechaHora",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fecha_hora" TIMESTAMP(3) NOT NULL,
DROP COLUMN "estado",
ADD COLUMN     "estado" "cita_estado" NOT NULL DEFAULT 'pendiente';

-- AlterTable
ALTER TABLE "comisiones" DROP COLUMN "generadoEn",
ADD COLUMN     "generado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "empleados" DROP COLUMN "createdAt",
DROP COLUMN "porcentajeComision",
DROP COLUMN "usuarioId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "porcentaje_comision" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "usuario_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "empleados_sucursales" DROP COLUMN "rolLocal",
ADD COLUMN     "rol_local" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "existencias" DROP COLUMN "stockActual",
DROP COLUMN "stockMinimo",
DROP COLUMN "updatedAt",
ADD COLUMN     "stock_actual" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "stock_minimo" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "liquidaciones" DROP COLUMN "generadoEn",
DROP COLUMN "montoTotal",
DROP COLUMN "periodoFin",
DROP COLUMN "periodoInicio",
ADD COLUMN     "generado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "monto_total" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "periodo_fin" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "periodo_inicio" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "materiales" DROP COLUMN "costoUnitario",
ADD COLUMN     "costo_unitario" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "notificaciones" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "promociones" DROP COLUMN "fechaFin",
DROP COLUMN "fechaInicio",
ADD COLUMN     "fecha_fin" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "fecha_inicio" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "promociones_aplicadas" DROP COLUMN "aplicadoEn",
DROP COLUMN "montoDescontado",
DROP COLUMN "porcentajeAplicado",
ADD COLUMN     "aplicado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "monto_descontado" DECIMAL(65,30),
ADD COLUMN     "porcentaje_aplicado" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "puntos_movimientos" DROP COLUMN "tipo",
ADD COLUMN     "tipo" "movimiento_tipo" NOT NULL;

-- AlterTable
ALTER TABLE "servicios" DROP COLUMN "duracionMinutos",
DROP COLUMN "precioBase",
ADD COLUMN     "duracion_minutos" INTEGER NOT NULL,
ADD COLUMN     "precio_base" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "servicios_sucursal" DROP COLUMN "duracionMinutos",
ADD COLUMN     "duracion_minutos" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "sucursales" DROP COLUMN "createdAt",
DROP COLUMN "zonaHoraria",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "zona_horaria" TEXT NOT NULL DEFAULT 'America/Mexico_City';

-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "createdAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropEnum
DROP TYPE "CitaEstado";

-- DropEnum
DROP TYPE "MovimientoTipo";

-- CreateIndex
CREATE INDEX "citas_fecha_hora_idx" ON "citas"("fecha_hora");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_usuario_id_key" ON "empleados"("usuario_id");

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

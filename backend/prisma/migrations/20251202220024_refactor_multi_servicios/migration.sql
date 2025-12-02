/*
  Warnings:

  - You are about to drop the column `servicioId` on the `citas` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "citas" DROP CONSTRAINT "citas_servicioId_fkey";

-- DropIndex
DROP INDEX "citas_servicioId_idx";

-- AlterTable
ALTER TABLE "citas" DROP COLUMN "servicioId";

-- CreateTable
CREATE TABLE "citas_servicios" (
    "cita_id" TEXT NOT NULL,
    "servicio_id" TEXT NOT NULL,
    "precio" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "citas_servicios_pkey" PRIMARY KEY ("cita_id","servicio_id")
);

-- AddForeignKey
ALTER TABLE "citas_servicios" ADD CONSTRAINT "citas_servicios_cita_id_fkey" FOREIGN KEY ("cita_id") REFERENCES "citas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citas_servicios" ADD CONSTRAINT "citas_servicios_servicio_id_fkey" FOREIGN KEY ("servicio_id") REFERENCES "servicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

import { PrismaClient } from "@prisma/client";
import {
  branches,
  services_catalog,
  services_overrides,
  promotions_catalog,
  inventory_snapshot,
} from "../src/common/mocks/sample-data";

const prisma = new PrismaClient();

/**
 * Definición local de la estructura de una fila de inventario en los mocks.
 * Ayuda a TypeScript a entender el tipo 'any' que viene de sample-data.
 */
type InventoryRow = {
  material: string;
  stockActual: number;
  stockMinimo: number;
};

async function main() {
  console.log("🌱 Iniciando seed...");

  // 1. Sucursales
  await prisma.$transaction(
    branches.map((branch) =>
      prisma.sucursal.upsert({
        where: { id: branch.id },
        update: {},
        create: {
          id: branch.id,
          nombre: branch.nombre,
          zonaHoraria: branch.zonaHoraria,
        },
      })
    )
  );

  // 2. Servicios
  await prisma.$transaction(
    services_catalog.map((service) =>
      prisma.servicio.upsert({
        where: { id: service.id },
        update: {},
        create: {
          id: service.id,
          nombre: service.nombre,
          precioBase: service.precioBase,
          duracionMinutos: service.duracionMinutos,
        },
      })
    )
  );

  // 3. Overrides
  await prisma.$transaction(
    services_overrides.map((override) =>
      prisma.servicioSucursal.upsert({
        where: {
          servicioId_sucursalId: {
            servicioId: override.servicioId,
            sucursalId: override.sucursalId,
          },
        },
        update: {},
        create: {
          servicioId: override.servicioId,
          sucursalId: override.sucursalId,
          precio: override.precio,
          duracionMinutos: override.duracionMinutos,
        },
      })
    )
  );

  // 4. Promociones
  await prisma.$transaction(
    promotions_catalog.map((promo) =>
      prisma.promocion.upsert({
        where: { id: promo.id },
        update: {},
        create: {
          id: promo.id,
          nombre: promo.nombre,
          descuento: promo.descuento,
          fechaInicio: new Date(),
          fechaFin: new Date("2026-12-31"),
          tipo: "general",
          estado: promo.vigente,
        },
      })
    )
  );

  // 5. Materiales e Inventario
  const material_names = new Map<string, { nombre: string; unidad: string }>();

  // Recolectar nombres únicos
  // CORRECCIÓN: Tipamos explícitamente 'rows' como InventoryRow[]
  Object.entries(inventory_snapshot).forEach(([sucursal_id, rows]) => {
    (rows as InventoryRow[]).forEach((row) => {
      const material_id = `${sucursal_id}-${row.material.replace(/\s+/g, "-").toLowerCase()}`;
      material_names.set(material_id, {
        nombre: row.material,
        unidad: "unidad",
      });
    });
  });

  // Insertar Materiales
  await prisma.$transaction(
    Array.from(material_names.entries()).map(([id, info]) =>
      prisma.material.upsert({
        where: { id },
        update: {},
        create: {
          id,
          nombre: info.nombre,
          unidad: info.unidad,
          costoUnitario: 0,
        },
      })
    )
  );

  // Insertar Existencias
  // CORRECCIÓN: Tipamos explícitamente 'rows' y 'row' para evitar el error "implicitly has any type"
  await prisma.$transaction(
    Object.entries(inventory_snapshot).flatMap(([sucursalId, rows]) =>
      (rows as InventoryRow[]).map((row) => {
        const materialId = `${sucursalId}-${row.material.replace(/\s+/g, "-").toLowerCase()}`;
        return prisma.existencia.upsert({
          where: {
            sucursalId_materialId: {
              sucursalId,
              materialId,
            },
          },
          update: {},
          create: {
            sucursalId,
            materialId,
            stockActual: row.stockActual,
            stockMinimo: row.stockMinimo,
          },
        });
      })
    )
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("✅ Seeds aplicadas correctamente");
  })
  .catch(async (error) => {
    console.error("❌ Error en seeds:", error);
    await prisma.$disconnect();
    process.exit(1);
  });

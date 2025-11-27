import { PrismaClient } from "@prisma/client";
import {
  branches,
  services_catalog,
  services_overrides,
  promotions_catalog,
  inventory_snapshot,
} from "../src/common/mocks/sample-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // 1. Sucursales
  // El mock tiene: { id, nombre, zonaHoraria }
  await prisma.$transaction(
    branches.map((branch) =>
      prisma.sucursal.upsert({
        where: { id: branch.id },
        update: {},
        create: {
          id: branch.id,
          nombre: branch.nombre,
          zonaHoraria: branch.zonaHoraria, // Mock usa zonaHoraria
        },
      })
    )
  );

  // 2. Servicios
  // El mock tiene: { id, nombre, precioBase, duracionMinutos }
  await prisma.$transaction(
    services_catalog.map((service) =>
      prisma.servicio.upsert({
        where: { id: service.id },
        update: {},
        create: {
          id: service.id,
          nombre: service.nombre,
          precioBase: service.precioBase, // Mock usa precioBase
          duracionMinutos: service.duracionMinutos, // Mock usa duracionMinutos
        },
      })
    )
  );

  // 3. Overrides
  // El mock tiene: { servicioId, sucursalId, precio, duracionMinutos }
  await prisma.$transaction(
    services_overrides.map((override) =>
      prisma.servicioSucursal.upsert({
        where: {
          servicioId_sucursalId: {
            servicioId: override.servicioId, // Mock usa servicioId
            sucursalId: override.sucursalId, // Mock usa sucursalId
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
  // El mock tiene: { id, nombre, descuento, vigente }
  await prisma.$transaction(
    promotions_catalog.map((promo) =>
      prisma.promocion.upsert({
        where: { id: promo.id }, // Mock usa id
        update: {},
        create: {
          id: promo.id,
          nombre: promo.nombre,
          descuento: promo.descuento,
          fechaInicio: new Date(),
          fechaFin: new Date("2026-12-31"),
          tipo: "general",
          estado: promo.vigente, // Mapeamos 'vigente' del mock a 'estado' del schema
        },
      })
    )
  );

  // 5. Materiales e Inventario
  // El mock usa: { material, stockActual, stockMinimo }
  const material_names = new Map<string, { nombre: string; unidad: string }>();

  Object.entries(inventory_snapshot).forEach(([sucursalId, rows]) => {
    rows.forEach((row) => {
      const material_id = `${sucursalId}-${row.material.replace(/\s+/g, "-").toLowerCase()}`;
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
  await prisma.$transaction(
    Object.entries(inventory_snapshot).flatMap(([sucursalId, rows]) =>
      rows.map((row) => {
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
            stockActual: row.stockActual, // Mock usa stockActual
            stockMinimo: row.stockMinimo, // Mock usa stockMinimo
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

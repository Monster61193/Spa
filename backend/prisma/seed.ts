import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import {
  branches,
  services_catalog,
  services_overrides,
  promotions_catalog,
  inventory_snapshot,
} from "../src/common/mocks/sample-data";

const prisma = new PrismaClient();

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

  // 2. Usuarios y Empleados (FIX PARA SPRINT 3)
  const password = await bcrypt.hash("123456", 10);

  // A. Admin General (Usuario existente)
  await prisma.usuario.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      email: "admin@test.com",
      nombre: "Admin General",
      password,
      // Admin también es empleado para pruebas
      empleado: {
        create: {
          porcentajeComision: 0,
          sucursales: {
            create: [
              {
                sucursalId: "branch-principal",
                rolLocal: "admin",
                predeterminada: true,
              },
              {
                sucursalId: "branch-norte",
                rolLocal: "admin",
                predeterminada: false,
              },
            ],
          },
        },
      },
    },
  });

  // B. Ana Estilista (Empleado Principal)
  const ana = await prisma.usuario.upsert({
    where: { email: "ana@spa.com" },
    update: {},
    create: {
      email: "ana@spa.com",
      nombre: "Ana Estilista",
      password,
      empleado: {
        create: {
          porcentajeComision: 10, // 10% de comisión
          sucursales: {
            create: [
              {
                sucursalId: "branch-principal",
                rolLocal: "estilista",
                predeterminada: true,
              },
            ],
          },
        },
      },
    },
  });

  // C. Pedro Masajista (Empleado Principal + Norte)
  const pedro = await prisma.usuario.upsert({
    where: { email: "pedro@spa.com" },
    update: {},
    create: {
      email: "pedro@spa.com",
      nombre: "Pedro Masajista",
      password,
      empleado: {
        create: {
          porcentajeComision: 15, // 15% de comisión
          sucursales: {
            create: [
              {
                sucursalId: "branch-principal",
                rolLocal: "masajista",
                predeterminada: true,
              },
              {
                sucursalId: "branch-norte",
                rolLocal: "gerente",
                predeterminada: false,
              },
            ],
          },
        },
      },
    },
  });

  // D. Cliente Test
  await prisma.usuario.upsert({
    where: { email: "cliente@gmail.com" },
    update: {},
    create: {
      email: "cliente@gmail.com",
      nombre: "María Cliente",
      password,
    },
  });

  console.log("✅ Usuarios y Empleados creados.");

  // 3. Servicios
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

  // 4. Overrides
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

  // 5. Promociones
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

  // 6. Materiales e Inventario
  const material_names = new Map<string, { nombre: string; unidad: string }>();

  Object.entries(inventory_snapshot).forEach(([sucursal_id, rows]) => {
    (rows as InventoryRow[]).forEach((row) => {
      const material_id = `${sucursal_id}-${row.material.replace(/\s+/g, "-").toLowerCase()}`;
      material_names.set(material_id, {
        nombre: row.material,
        unidad: "unidad",
      });
    });
  });

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

  console.log("✅ Seed finalizado correctamente.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Error en seed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });

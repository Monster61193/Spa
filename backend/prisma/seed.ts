import { PrismaClient, CitaEstado, MovimientoTipo } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🔥 INICIANDO RESET MAESTRO DE BASE DE DATOS...");

  // 1. LIMPIEZA TOTAL (Orden específico por Foreign Keys)
  // Borramos datos transaccionales primero
  await prisma.auditLog.deleteMany();
  await prisma.notificacion.deleteMany();
  await prisma.promocionAplicada.deleteMany();
  await prisma.comision.deleteMany();
  await prisma.puntosMovimiento.deleteMany();
  await prisma.citaServicio.deleteMany();
  await prisma.cita.deleteMany();

  // Borramos inventario y catálogos dependientes
  await prisma.existencia.deleteMany();
  await prisma.servicioMaterial.deleteMany();
  await prisma.promocionServicio.deleteMany();
  await prisma.servicioSucursal.deleteMany();
  await prisma.promocion.deleteMany();
  await prisma.material.deleteMany();
  await prisma.servicio.deleteMany();

  // Borramos usuarios y sucursales
  await prisma.empleadoSucursal.deleteMany();
  await prisma.empleado.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.sucursal.deleteMany();

  console.log("✨ Base de datos limpia.");

  // ====================================================================
  // 2. SEMILLA: INFRAESTRUCTURA (Sucursales)
  // ====================================================================
  const suc_principal = await prisma.sucursal.create({
    data: {
      id: "branch-principal",
      nombre: "Sede Polanco (Principal)",
      zonaHoraria: "America/Mexico_City",
    },
  });

  const suc_norte = await prisma.sucursal.create({
    data: {
      id: "branch-norte",
      nombre: "Sede Satélite (Norte)",
      zonaHoraria: "America/Mexico_City",
    },
  });

  console.log("🏢 Sucursales creadas.");

  // ====================================================================
  // 3. SEMILLA: USUARIOS & EMPLEADOS
  // ====================================================================
  const password = await bcrypt.hash("123456", 10);

  // A. Admin General
  await prisma.usuario.create({
    data: {
      id: "user-admin",
      nombre: "Admin General",
      email: "admin@test.com",
      password,
      empleado: {
        create: {
          id: "emp-admin",
          porcentajeComision: 0,
          sucursales: {
            create: [
              {
                sucursalId: suc_principal.id,
                rolLocal: "admin",
                predeterminada: true,
              },
              {
                sucursalId: suc_norte.id,
                rolLocal: "admin",
                predeterminada: false,
              },
            ],
          },
        },
      },
    },
  });

  // B. Ana Estilista (Solo Principal - Comisión 10%)
  await prisma.usuario.create({
    data: {
      id: "user-ana",
      nombre: "Ana Estilista",
      email: "ana@spa.com",
      password,
      empleado: {
        create: {
          id: "emp-ana",
          porcentajeComision: 10,
          sucursales: {
            create: [
              {
                sucursalId: suc_principal.id,
                rolLocal: "estilista",
                predeterminada: true,
              },
            ],
          },
        },
      },
    },
  });

  // C. Pedro Masajista (Ambas sedes - Comisión 15%)
  await prisma.usuario.create({
    data: {
      id: "user-pedro",
      nombre: "Pedro Masajista",
      email: "pedro@spa.com",
      password,
      empleado: {
        create: {
          id: "emp-pedro",
          porcentajeComision: 15,
          sucursales: {
            create: [
              {
                sucursalId: suc_principal.id,
                rolLocal: "terapeuta",
                predeterminada: true,
              },
              {
                sucursalId: suc_norte.id,
                rolLocal: "gerente",
                predeterminada: false,
              },
            ],
          },
        },
      },
    },
  });

  // D. Cliente Recurrente
  await prisma.usuario.create({
    data: {
      id: "cli-sofia",
      nombre: "Sofía Cliente",
      email: "sofia@gmail.com",
      password,
    },
  });

  console.log("👥 Usuarios y Empleados creados.");

  // ====================================================================
  // 4. SEMILLA: CATÁLOGOS (Materiales y Servicios)
  // ====================================================================

  // Materiales
  const mat_aceite = await prisma.material.create({
    data: {
      id: "mat-aceite",
      nombre: "Aceite de Lavanda",
      unidad: "ml",
      costoUnitario: 5,
    },
  });
  const mat_toalla = await prisma.material.create({
    data: {
      id: "mat-toalla",
      nombre: "Toalla Desechable",
      unidad: "pz",
      costoUnitario: 15,
    },
  });
  const mat_gel = await prisma.material.create({
    data: {
      id: "mat-gel",
      nombre: "Gel Premium",
      unidad: "gr",
      costoUnitario: 50,
    },
  });

  // Inventario (Existencias)
  // Principal: Tiene de todo. Norte: Tiene poco Gel (para probar error de stock).
  await prisma.existencia.createMany({
    data: [
      {
        sucursalId: suc_principal.id,
        materialId: mat_aceite.id,
        stockActual: 1000,
        stockMinimo: 50,
      },
      {
        sucursalId: suc_principal.id,
        materialId: mat_toalla.id,
        stockActual: 500,
        stockMinimo: 20,
      },
      {
        sucursalId: suc_principal.id,
        materialId: mat_gel.id,
        stockActual: 200,
        stockMinimo: 10,
      },
      // Norte (Escasez simulada de Gel)
      {
        sucursalId: suc_norte.id,
        materialId: mat_aceite.id,
        stockActual: 100,
        stockMinimo: 20,
      },
      {
        sucursalId: suc_norte.id,
        materialId: mat_gel.id,
        stockActual: 2,
        stockMinimo: 5,
      }, // ¡Solo 2 gramos!
    ],
  });

  // Servicios y Recetas
  await prisma.servicio.create({
    data: {
      id: "srv-masaje",
      nombre: "Masaje Relajante (60min)",
      precioBase: 800,
      duracionMinutos: 60,
      serviciosMateriales: {
        create: [
          { materialId: mat_aceite.id, cantidad: 50 }, // Usa 50ml
          { materialId: mat_toalla.id, cantidad: 2 }, // Usa 2 toallas
        ],
      },
    },
  });

  await prisma.servicio.create({
    data: {
      id: "srv-manicure",
      nombre: "Manicure Gel",
      precioBase: 450,
      duracionMinutos: 45,
      serviciosMateriales: {
        create: [
          { materialId: mat_gel.id, cantidad: 5 }, // Usa 5gr
          { materialId: mat_toalla.id, cantidad: 1 },
        ],
      },
    },
  });

  console.log("📦 Catálogos e Inventario cargados.");

  // ====================================================================
  // 5. SEMILLA: PROMOCIONES
  // ====================================================================
  await prisma.promocion.create({
    data: {
      id: "promo-verano",
      nombre: "Verano 10% OFF",
      descuento: 10,
      tipo: "Global",
      fechaInicio: new Date("2024-01-01"),
      fechaFin: new Date("2030-12-31"),
      estado: true,
    },
  });

  console.log("🏷️ Promociones cargadas.");

  // ====================================================================
  // 6. SEMILLA: CITAS (Escenarios de Prueba)
  // ====================================================================
  const hoy = new Date();

  // Cita 1: Lista para cerrar (En Principal, Ana, Masaje)
  await prisma.cita.create({
    data: {
      id: "cita-ready",
      sucursalId: suc_principal.id,
      usuarioId: "cli-sofia",
      empleadoId: "emp-ana", // Asignada
      fechaHora: hoy,
      estado: CitaEstado.pendiente,
      total: 800,
      anticipo: 0,
      servicios: {
        create: [{ servicioId: "srv-masaje", precio: 800 }],
      },
    },
  });

  // Cita 2: Con Anticipo (En Principal, Pedro, Manicure)
  await prisma.cita.create({
    data: {
      id: "cita-anticipo",
      sucursalId: suc_principal.id,
      usuarioId: "cli-sofia",
      // Sin empleado asignado (Para probar asignación al cierre)
      fechaHora: new Date(hoy.getTime() + 3600000), // +1 hora
      estado: CitaEstado.pendiente,
      total: 450,
      anticipo: 200, // Pagó 200 por adelantado
      servicios: {
        create: [{ servicioId: "srv-manicure", precio: 450 }],
      },
    },
  });

  // Cita 3: Histórica (Cerrada)
  await prisma.cita.create({
    data: {
      id: "cita-cerrada",
      sucursalId: suc_principal.id,
      usuarioId: "cli-sofia",
      empleadoId: "emp-ana",
      fechaHora: new Date("2023-01-01"),
      estado: CitaEstado.cerrada,
      total: 800,
      anticipo: 0,
      servicios: {
        create: [{ servicioId: "srv-masaje", precio: 800 }],
      },
    },
  });

  // Cita 4: Peligrosa (En Norte, requiere Gel, Stock bajo)
  // Al intentar cerrar esta, debería fallar por stock insuficiente
  await prisma.cita.create({
    data: {
      id: "cita-error-stock",
      sucursalId: suc_norte.id,
      usuarioId: "cli-sofia",
      fechaHora: hoy,
      estado: CitaEstado.pendiente,
      total: 450,
      servicios: {
        create: [{ servicioId: "srv-manicure", precio: 450 }],
      },
    },
  });

  console.log("📅 Citas de prueba generadas.");
  console.log("🚀 SEED COMPLETADO EXITOSAMENTE.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

import { Test, TestingModule } from "@nestjs/testing";
import { AppointmentsService } from "./appointments.service";
import { PrismaService } from "../prisma/prisma.service";
import { ConflictException, BadRequestException } from "@nestjs/common";

/**
 * Mocks de datos para simular la base de datos.
 */
const mock_cita = {
  id: "cita-1",
  sucursalId: "suc-1",
  estado: "pendiente",
  total: 1000,
  usuarioId: "user-1",
  servicio: {
    serviciosMateriales: [{ materialId: "mat-1", cantidad: 10 }],
  },
  empleado: { id: "emp-1", porcentajeComision: 10 },
};

const mock_existencia_suficiente = {
  stockActual: 50,
  stockMinimo: 5,
};

const mock_existencia_insuficiente = {
  stockActual: 2, // Menos que los 10 requeridos
  stockMinimo: 5,
};

/**
 * Suite de pruebas unitarias para AppointmentsService.
 * Se enfoca en la lógica transaccional de cierre.
 */
describe("AppointmentsService", () => {
  let service: AppointmentsService;
  let prisma: PrismaService;

  // CORRECCIÓN: Tipamos explícitamente como 'any' para evitar
  // el error de referencia circular en la inferencia de tipos de TypeScript.
  const mock_prisma: any = {
    cita: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    existencia: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    puntosMovimiento: {
      create: jest.fn(),
    },
    comision: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  // CORRECCIÓN: Definimos $transaction después o dentro del objeto usando 'any'
  // Simula que la transacción ejecuta el callback inmediatamente pasando el mismo mock (tx)
  mock_prisma.$transaction = jest.fn((callback) => callback(mock_prisma));

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: mock_prisma },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe("cerrar", () => {
    it("debe cerrar la cita correctamente si hay stock suficiente", async () => {
      // 1. Setup: Cita existe y hay inventario
      mock_prisma.cita.findUnique.mockResolvedValue(mock_cita);
      mock_prisma.existencia.findUnique.mockResolvedValue(
        mock_existencia_suficiente
      );
      // Simulamos que update retorna la cita cerrada
      mock_prisma.cita.update.mockResolvedValue({
        ...mock_cita,
        estado: "cerrada",
      });
      // Simulamos otras creaciones
      mock_prisma.puntosMovimiento.create.mockResolvedValue({});
      mock_prisma.comision.create.mockResolvedValue({});
      mock_prisma.auditLog.create.mockResolvedValue({});

      // 2. Ejecución
      const resultado = await service.cerrar("cita-1", "suc-1");

      // 3. Verificaciones
      expect(resultado).toHaveProperty("mensaje");
      // Se debió descontar inventario
      expect(mock_prisma.existencia.update).toHaveBeenCalled();
      // Se debieron generar puntos
      expect(mock_prisma.puntosMovimiento.create).toHaveBeenCalled();
      // Se debió generar auditoría
      expect(mock_prisma.auditLog.create).toHaveBeenCalled();
    });

    it("debe lanzar ConflictException si NO hay stock suficiente", async () => {
      // 1. Setup: Cita existe pero inventario es bajo
      mock_prisma.cita.findUnique.mockResolvedValue(mock_cita);
      mock_prisma.existencia.findUnique.mockResolvedValue(
        mock_existencia_insuficiente
      );

      // 2. Ejecución y Assert
      await expect(service.cerrar("cita-1", "suc-1")).rejects.toThrow(
        ConflictException
      );

      // Asegurar que NO se cerró la cita
      expect(mock_prisma.cita.update).not.toHaveBeenCalled();
    });

    it("debe lanzar BadRequestException si la sucursal no coincide", async () => {
      // 1. Setup: Cita pertenece a 'suc-1', pero intentamos cerrar desde 'suc-OTRA'
      mock_prisma.cita.findUnique.mockResolvedValue(mock_cita);

      // 2. Ejecución y Assert
      await expect(service.cerrar("cita-1", "suc-OTRA")).rejects.toThrow(
        BadRequestException
      );
    });
  });
});

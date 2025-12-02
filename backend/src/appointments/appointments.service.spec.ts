import { Test, TestingModule } from "@nestjs/testing";
import { AppointmentsService } from "./appointments.service";
import { PrismaService } from "../prisma/prisma.service";
import { ConflictException, BadRequestException } from "@nestjs/common";

/**
 * Mock Data: Estructura actualizada para Sprint 1 (Multi-servicios).
 */
const mock_cita_multi = {
  id: "cita-1",
  sucursalId: "suc-1",
  estado: "pendiente",
  total: 1500,
  usuarioId: "user-1",
  // CAMBIO: Estructura anidada de servicios -> servicio -> materiales
  servicios: [
    {
      servicioId: "srv-1",
      servicio: {
        nombre: "Manicure",
        serviciosMateriales: [{ materialId: "mat-1", cantidad: 10 }],
      },
    },
    {
      servicioId: "srv-2",
      servicio: {
        nombre: "Pedicure",
        serviciosMateriales: [{ materialId: "mat-2", cantidad: 5 }],
      },
    },
  ],
  empleado: { id: "emp-1", porcentajeComision: 10 },
};

const mock_existencia_suficiente = { stockActual: 100, stockMinimo: 5 };
const mock_existencia_insuficiente = { stockActual: 2, stockMinimo: 5 };

/**
 * Suite de Pruebas: Lógica de Negocio AppointmentsService.
 */
describe("AppointmentsService", () => {
  let service: AppointmentsService;
  let prisma: PrismaService;

  // Mock de Prisma con soporte para transacciones
  const mock_prisma: any = {
    cita: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
    existencia: { findUnique: jest.fn(), update: jest.fn() },
    puntosMovimiento: { create: jest.fn() },
    comision: { create: jest.fn() },
    auditLog: { create: jest.fn() },
    servicio: { findMany: jest.fn() },
  };

  // Simulación de transacción inmediata
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

  describe("cerrar (Multi-servicio)", () => {
    it("debe descontar inventario para TODOS los servicios si hay stock", async () => {
      // ARRANGE
      mock_prisma.cita.findUnique.mockResolvedValue(mock_cita_multi);
      // Siempre hay stock suficiente
      mock_prisma.existencia.findUnique.mockResolvedValue(
        mock_existencia_suficiente
      );
      mock_prisma.cita.update.mockResolvedValue({
        ...mock_cita_multi,
        estado: "cerrada",
      });

      // ACT
      const resultado = await service.cerrar("cita-1", "suc-1");

      // ASSERT
      expect(resultado).toHaveProperty("mensaje");

      // Verificar que se llamó a update de existencia por cada material en la lista
      // (1 material por servicio * 2 servicios = 2 llamadas)
      expect(mock_prisma.existencia.update).toHaveBeenCalledTimes(2);

      // Verificar generación de puntos
      expect(mock_prisma.puntosMovimiento.create).toHaveBeenCalled();
    });

    it("debe bloquear cierre si falta material para ALGUNO de los servicios", async () => {
      // ARRANGE
      mock_prisma.cita.findUnique.mockResolvedValue(mock_cita_multi);

      // Simulamos: Primer material OK, Segundo material (Pedicure) INSUFICIENTE
      mock_prisma.existencia.findUnique
        .mockResolvedValueOnce(mock_existencia_suficiente)
        .mockResolvedValueOnce(mock_existencia_insuficiente);

      // ACT & ASSERT
      await expect(service.cerrar("cita-1", "suc-1")).rejects.toThrow(
        ConflictException
      );

      // Importante: La cita NO debe cerrarse
      expect(mock_prisma.cita.update).not.toHaveBeenCalled();
    });
  });
});

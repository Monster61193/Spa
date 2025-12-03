import { Test, TestingModule } from "@nestjs/testing";
import { AppointmentsService } from "./appointments.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";

// Mocks simples para reducir ruido
const mock_cita_pendiente = {
  id: "cita-p-1",
  sucursalId: "suc-1",
  estado: "pendiente",
  total: 500,
  servicios: [],
};

const mock_cita_cerrada = {
  ...mock_cita_pendiente,
  id: "cita-c-1",
  estado: "cerrada",
};

const mock_servicios_nuevos = [
  { id: "srv-new-1", precioBase: 200, nombre: "Srv 1" },
  { id: "srv-new-2", precioBase: 300, nombre: "Srv 2" },
];

describe("AppointmentsService", () => {
  let service: AppointmentsService;
  let prisma: PrismaService;

  const mock_prisma: any = {
    cita: { findUnique: jest.fn(), update: jest.fn() },
    servicio: { findMany: jest.fn() },
    citaServicio: { deleteMany: jest.fn() },
    $transaction: jest.fn((cb) => cb(mock_prisma)), // Auto-ejecutar transacción
  };

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

  describe("actualizar_items (Sprint 2)", () => {
    it("debe reemplazar servicios y recalcular total si la cita está pendiente", async () => {
      // ARRANGE
      mock_prisma.cita.findUnique.mockResolvedValue(mock_cita_pendiente);
      mock_prisma.servicio.findMany.mockResolvedValue(mock_servicios_nuevos);

      // Simulamos respuesta del update final
      mock_prisma.cita.update.mockResolvedValue({
        ...mock_cita_pendiente,
        total: 500, // 200 + 300
        servicios: [{}, {}], // Dos servicios creados
      });

      // ACT
      const resultado = await service.actualizar_items(
        "cita-p-1",
        ["srv-new-1", "srv-new-2"],
        "suc-1"
      );

      // ASSERT
      // 1. Verificar que se borraron los anteriores
      expect(mock_prisma.citaServicio.deleteMany).toHaveBeenCalledWith({
        where: { citaId: "cita-p-1" },
      });

      // 2. Verificar que se actualizó la cita con el nuevo total
      expect(mock_prisma.cita.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "cita-p-1" },
          data: expect.objectContaining({
            total: 500, // Suma correcta
          }),
        })
      );

      expect(resultado).toHaveProperty("mensaje");
    });

    it("debe bloquear la edición si la cita ya está cerrada", async () => {
      // ARRANGE
      mock_prisma.cita.findUnique.mockResolvedValue(mock_cita_cerrada);

      // ACT & ASSERT
      await expect(
        service.actualizar_items("cita-c-1", ["srv-1"], "suc-1")
      ).rejects.toThrow(ConflictException); // Error 409

      // Verificar que NO se borró nada
      expect(mock_prisma.citaServicio.deleteMany).not.toHaveBeenCalled();
    });

    it("debe fallar si se intenta editar una cita de otra sucursal", async () => {
      // ARRANGE
      mock_prisma.cita.findUnique.mockResolvedValue(mock_cita_pendiente);

      // ACT & ASSERT
      // Enviamos "suc-2" pero la cita tiene "suc-1"
      await expect(
        service.actualizar_items("cita-p-1", ["srv-1"], "suc-2")
      ).rejects.toThrow(BadRequestException); // Error 400
    });
  });
});

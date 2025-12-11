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
    cita: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
    servicio: { findMany: jest.fn() },
    citaServicio: { deleteMany: jest.fn() },
    //Mock para validar la relación empleado-sucursal
    empleadoSucursal: { findUnique: jest.fn() },
    $transaction: jest.fn(async (cb: any) => await cb(mock_prisma)), // Auto-ejecutar transacción async
  };

  beforeEach(async () => {
    jest.resetAllMocks(); // Limpieza vital
    // Restaurar la implementación de $transaction después del reset
    mock_prisma.$transaction.mockImplementation(
      async (cb: any) => await cb(mock_prisma)
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: mock_prisma },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  describe("actualizar_items (Sprint 2)", () => {
    it("debe reemplazar servicios y recalcular total si la cita está pendiente", async () => {
      // ARRANGE
      mock_prisma.cita.findUnique.mockResolvedValue(mock_cita_pendiente);
      mock_prisma.servicio.findMany.mockResolvedValue(mock_servicios_nuevos);
      mock_prisma.citaServicio.deleteMany.mockResolvedValue({ count: 0 });

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

  describe("agendar (Sprint 3 - Asignación)", () => {
    const payload_base = {
      usuario_id: "user-1",
      servicios_ids: ["srv-1"],
      fecha_hora: "2025-10-25T10:00:00Z",
    };

    it("debe permitir agendar con un empleado válido de la sucursal", async () => {
      // ARRANGE
      const sucursal_id = "suc-1";
      const empleado_id = "emp-1";

      // 1. Simulamos que el servicio existe
      mock_prisma.servicio.findMany.mockResolvedValue([
        { id: "srv-1", precioBase: 100 },
      ]);

      // 2. Simulamos que el empleado SÍ pertenece a la sucursal
      mock_prisma.empleadoSucursal.findUnique.mockResolvedValue({
        empleadoId: empleado_id,
      });

      // 3. Simulamos creación exitosa
      mock_prisma.cita.create.mockResolvedValue({ id: "cita-new" });

      // ACT
      await service.agendar({ ...payload_base, empleado_id }, sucursal_id);

      // ASSERT
      // Verificamos que se validó la pertenencia del empleado
      expect(mock_prisma.empleadoSucursal.findUnique).toHaveBeenCalledWith({
        where: {
          empleadoId_sucursalId: {
            empleadoId: empleado_id,
            sucursalId: sucursal_id,
          },
        },
      });

      // Verificamos que se guardó el empleadoId en la cita
      expect(mock_prisma.cita.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            empleadoId: empleado_id, // <--- Dato crítico
          }),
        })
      );
    });

    it("debe lanzar BadRequest si el empleado no pertenece a la sucursal", async () => {
      // ARRANGE
      mock_prisma.servicio.findMany.mockResolvedValue([{ id: "srv-1" }]);

      // Simulamos que NO existe la relación (null)
      mock_prisma.empleadoSucursal.findUnique.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(
        service.agendar(
          { ...payload_base, empleado_id: "emp-de-otra-sucursal" },
          "suc-1"
        )
      ).rejects.toThrow(BadRequestException);

      // Aseguramos que NO se creó la cita
      expect(mock_prisma.cita.create).not.toHaveBeenCalled();
    });
  });

  describe("agendar (Validaciones Financieras)", () => {
    it("debe rechazar la cita si el anticipo supera al total", async () => {
      // ARRANGE
      const payload = {
        usuario_id: "user-1",
        servicios_ids: ["srv-caro"],
        fecha_hora: "2025-10-30T10:00:00Z",
        anticipo: 2000, // Anticipo excesivo
      };

      // Simulamos que el servicio cuesta menos que el anticipo
      mock_prisma.servicio.findMany.mockResolvedValue([
        { id: "srv-caro", precioBase: 1000 }, // Total = 1000
      ]);

      // ACT & ASSERT
      await expect(service.agendar(payload, "suc-1")).rejects.toThrow(
        BadRequestException
      ); // Debe fallar

      // Aseguramos que no se llamó a crear
      expect(mock_prisma.cita.create).not.toHaveBeenCalled();
    });
  });
});

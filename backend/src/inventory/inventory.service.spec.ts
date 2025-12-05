import { Test, TestingModule } from "@nestjs/testing";
import { InventoryService } from "./inventory.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotFoundException } from "@nestjs/common";

// CAMBIO: Agregamos ': any' para evitar el error de inferencia circular
// al usar 'mock_prisma' dentro de su propia definición ($transaction).
const mock_prisma: any = {
  material: { create: jest.fn(), findFirst: jest.fn() },
  existencia: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  auditLog: { create: jest.fn() },
  // Simula la transacción ejecutando el callback inmediatamente
  $transaction: jest.fn((callback) => callback(mock_prisma)),
};

describe("InventoryService", () => {
  let service: InventoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mock_prisma },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  describe("crear_material", () => {
    it("debe ejecutar una transacción creando Material + Existencia + Audit", async () => {
      // ARRANGE
      const data = {
        nombre: "Aceite Nuevo",
        unidad: "ml",
        stock_inicial: 100,
        stock_minimo: 10,
      };
      const sucursal_id = "suc-1";

      mock_prisma.material.create.mockResolvedValue({
        id: "mat-new",
        nombre: "Aceite Nuevo",
      });

      // ACT
      await service.crear_material(data, sucursal_id);

      // ASSERT
      expect(mock_prisma.$transaction).toHaveBeenCalled();

      expect(mock_prisma.material.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ nombre: "Aceite Nuevo" }),
        })
      );

      expect(mock_prisma.existencia.create).toHaveBeenCalledWith({
        data: {
          sucursalId: "suc-1",
          materialId: "mat-new",
          stockActual: 100,
          stockMinimo: 10,
        },
      });

      expect(mock_prisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe("reabastecer", () => {
    it("debe incrementar el stock atómicamente si el material existe", async () => {
      // ARRANGE
      mock_prisma.existencia.findUnique.mockResolvedValue({ stockActual: 10 });
      mock_prisma.existencia.update.mockResolvedValue({ stockActual: 60 });

      // ACT
      const nuevo_stock = await service.reabastecer("mat-1", 50, "suc-1");

      // ASSERT
      expect(nuevo_stock).toBe(60);

      expect(mock_prisma.existencia.update).toHaveBeenCalledWith({
        where: {
          sucursalId_materialId: { sucursalId: "suc-1", materialId: "mat-1" },
        },
        data: {
          // Verificamos que se use la operación atómica 'increment'
          stockActual: { increment: 50 },
        },
      });

      expect(mock_prisma.auditLog.create).toHaveBeenCalled();
    });

    it("debe lanzar NotFoundException si el material no está en la sucursal", async () => {
      mock_prisma.existencia.findUnique.mockResolvedValue(null);

      await expect(
        service.reabastecer("mat-fantasma", 10, "suc-1")
      ).rejects.toThrow(NotFoundException);
    });
  });
});

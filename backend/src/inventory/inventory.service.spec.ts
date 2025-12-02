import { Test, TestingModule } from "@nestjs/testing";
import { InventoryService } from "./inventory.service";
import { PrismaService } from "../prisma/prisma.service";
import { inventory_snapshot } from "../common/mocks/sample-data";

// Mock de datos reales de la BD
const mock_db_existencias = [
  {
    materialId: "mat-real-1",
    stockActual: 100,
    stockMinimo: 10,
    material: { nombre: "Material Real", unidad: "pz" },
  },
];

describe("InventoryService", () => {
  let service: InventoryService;
  let prisma: PrismaService;

  const mock_prisma = {
    existencia: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mock_prisma },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it("debe retornar datos de la BD si la conexión es exitosa", async () => {
    // ARRANGE: La BD responde bien
    mock_prisma.existencia.findMany.mockResolvedValue(mock_db_existencias);

    // ACT
    const resultado = await service.listar("suc-1");

    // ASSERT
    expect(resultado).toHaveLength(1);
    expect(resultado[0].material).toBe("Material Real"); // Viene de la BD
    expect(prisma.existencia.findMany).toHaveBeenCalled();
  });

  it("debe retornar MOCKS si la BD falla (Graceful Degradation)", async () => {
    // ARRANGE: La BD explota
    mock_prisma.existencia.findMany.mockRejectedValue(
      new Error("Conexión perdida")
    );

    // ACT
    const resultado = await service.listar("branch-principal"); // Usamos un ID que exista en los mocks

    // ASSERT
    // No debe lanzar error, sino retornar el array de fallback
    expect(resultado).toBeDefined();
    // Verificamos que sean los mocks (usualmente empiezan diferente o tienen datos fijos)
    expect(resultado.length).toBeGreaterThan(0);

    // Verificamos que sea data del mock (según tu sample-data)
    const mockEsperado = inventory_snapshot["branch-principal"][0];
    expect(resultado[0].material).toBe(mockEsperado.material);
  });
});

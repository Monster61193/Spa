import { Test, TestingModule } from "@nestjs/testing";
import { BranchesService } from "./branches.service";
import { PrismaService } from "../prisma/prisma.service";
import { branches as sample_branches } from "../common/mocks/sample-data";

describe("BranchesService", () => {
  let service: BranchesService;

  const mock_prisma = {
    sucursal: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        { provide: PrismaService, useValue: mock_prisma },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
  });

  it("debe usar el Fallback (Mocks) si la base de datos falla", async () => {
    // ARRANGE: Simulamos error crítico en DB
    mock_prisma.sucursal.findMany.mockRejectedValue(new Error("DB Down"));

    // ACT
    const resultado = await service.listar();

    // ASSERT
    // Debe sobrevivir al error y devolver lo que tenga en memoria
    expect(resultado).toEqual(sample_branches);
  });

  it("debe devolver datos reales si la BD responde", async () => {
    const sucursales_reales = [{ id: "real-1", nombre: "Sucursal Real" }];
    mock_prisma.sucursal.findMany.mockResolvedValue(sucursales_reales);

    const resultado = await service.listar();

    expect(resultado).toEqual(sucursales_reales);
  });
});

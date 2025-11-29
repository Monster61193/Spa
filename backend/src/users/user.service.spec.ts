import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma/prisma.service";

// Mock de Prisma
const mock_prisma_service = {
  usuario: {
    findMany: jest.fn(),
  },
};

/**
 * Suite de pruebas para UsersService.
 * Verifica la obtención de clientes desde la base de datos.
 */
describe("UsersService", () => {
  let service: UsersService;
  let prisma: typeof mock_prisma_service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mock_prisma_service },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
  });

  it("listar_clientes() retorna una lista de usuarios", async () => {
    // 1. Setup
    const clientes_simulados = [
      { id: "user-1", nombre: "Cliente Uno", email: "uno@test.com" },
      { id: "user-2", nombre: "Cliente Dos", email: "dos@test.com" },
    ];
    mock_prisma_service.usuario.findMany.mockResolvedValue(clientes_simulados);

    // 2. Ejecución
    const resultado = await service.listar_clientes();

    // 3. Verificación
    expect(resultado).toEqual(clientes_simulados);
    expect(prisma.usuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { id: true, nombre: true, email: true },
      })
    );
  });
});

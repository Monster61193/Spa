import { Test, TestingModule } from "@nestjs/testing";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

// Mock del Servicio
const mock_users_service = {
  listar_clientes: jest.fn(),
};

/**
 * Suite de pruebas para UsersController.
 * Verifica que los endpoints respondan con la estructura correcta.
 */
describe("UsersController", () => {
  let controller: UsersController;
  let service: typeof mock_users_service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mock_users_service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService);
  });

  it("listar_clientes() retorna la estructura { items: [] }", async () => {
    // 1. Setup
    const lista_clientes = [{ id: "1", nombre: "Juan" }];
    mock_users_service.listar_clientes.mockResolvedValue(lista_clientes);

    // 2. Ejecución
    const respuesta = await controller.listar_clientes();

    // 3. Verificación
    expect(respuesta).toEqual({ items: lista_clientes });
    expect(service.listar_clientes).toHaveBeenCalled();
  });
});

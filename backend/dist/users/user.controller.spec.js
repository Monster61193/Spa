"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const users_controller_1 = require("./users.controller");
const users_service_1 = require("./users.service");
const mock_users_service = {
    listar_clientes: jest.fn(),
};
describe("UsersController", () => {
    let controller;
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [users_controller_1.UsersController],
            providers: [{ provide: users_service_1.UsersService, useValue: mock_users_service }],
        }).compile();
        controller = module.get(users_controller_1.UsersController);
        service = module.get(users_service_1.UsersService);
    });
    it("listar_clientes() retorna la estructura { items: [] }", async () => {
        const lista_clientes = [{ id: "1", nombre: "Juan" }];
        mock_users_service.listar_clientes.mockResolvedValue(lista_clientes);
        const respuesta = await controller.listar_clientes();
        expect(respuesta).toEqual({ items: lista_clientes });
        expect(service.listar_clientes).toHaveBeenCalled();
    });
});

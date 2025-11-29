"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const users_service_1 = require("./users.service");
const prisma_service_1 = require("../prisma/prisma.service");
const mock_prisma_service = {
    usuario: {
        findMany: jest.fn(),
    },
};
describe("UsersService", () => {
    let service;
    let prisma;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                users_service_1.UsersService,
                { provide: prisma_service_1.PrismaService, useValue: mock_prisma_service },
            ],
        }).compile();
        service = module.get(users_service_1.UsersService);
        prisma = module.get(prisma_service_1.PrismaService);
    });
    it("listar_clientes() retorna una lista de usuarios", async () => {
        const clientes_simulados = [
            { id: "user-1", nombre: "Cliente Uno", email: "uno@test.com" },
            { id: "user-2", nombre: "Cliente Dos", email: "dos@test.com" },
        ];
        mock_prisma_service.usuario.findMany.mockResolvedValue(clientes_simulados);
        const resultado = await service.listar_clientes();
        expect(resultado).toEqual(clientes_simulados);
        expect(prisma.usuario.findMany).toHaveBeenCalledWith(expect.objectContaining({
            select: { id: true, nombre: true, email: true },
        }));
    });
});

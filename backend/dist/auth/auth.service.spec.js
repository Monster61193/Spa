"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const auth_service_1 = require("./auth.service");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const mock_prisma_service = {
    usuario: {
        findUnique: jest.fn(),
    },
};
const mock_jwt_service = {
    sign: jest.fn(),
};
describe("AuthService", () => {
    let service;
    let prisma;
    let jwt_service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: prisma_service_1.PrismaService, useValue: mock_prisma_service },
                { provide: jwt_1.JwtService, useValue: mock_jwt_service },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        prisma = module.get(prisma_service_1.PrismaService);
        jwt_service = module.get(jwt_1.JwtService);
    });
    describe("login", () => {
        it("debe lanzar UnauthorizedException si el usuario no existe", async () => {
            mock_prisma_service.usuario.findUnique.mockResolvedValue(null);
            const login_dto = { email: "fantasma@test.com", password: "123" };
            await expect(service.login(login_dto)).rejects.toThrow(common_1.UnauthorizedException);
        });
        it("debe lanzar UnauthorizedException si la contraseña es incorrecta", async () => {
            const password_hasheada = await bcrypt.hash("secreto_real", 10);
            mock_prisma_service.usuario.findUnique.mockResolvedValue({
                id: "user-1",
                email: "test@test.com",
                password: password_hasheada,
                empleado: { sucursales: [] },
            });
            const login_dto = {
                email: "test@test.com",
                password: "password_incorrecta",
            };
            await expect(service.login(login_dto)).rejects.toThrow(common_1.UnauthorizedException);
        });
        it("debe devolver un access_token si las credenciales son válidas", async () => {
            const password_real = "123456";
            const password_hasheada = await bcrypt.hash(password_real, 10);
            mock_prisma_service.usuario.findUnique.mockResolvedValue({
                id: "user-1",
                email: "admin@test.com",
                nombre: "Admin",
                password: password_hasheada,
                empleado: { sucursales: [] },
            });
            const token_falso = "token_firmado_falso";
            mock_jwt_service.sign.mockReturnValue(token_falso);
            const login_dto = { email: "admin@test.com", password: password_real };
            const resultado = await service.login(login_dto);
            expect(resultado).toHaveProperty("access_token", token_falso);
            expect(resultado).toHaveProperty("user");
            expect(jwt_service.sign).toHaveBeenCalled();
        });
    });
});

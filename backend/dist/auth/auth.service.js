"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
let AuthService = class AuthService {
    constructor(prisma, jwt_service) {
        this.prisma = prisma;
        this.jwt_service = jwt_service;
    }
    async login(payload) {
        const { email, password } = payload;
        const usuario_encontrado = await this.prisma.usuario.findUnique({
            where: { email },
            include: {
                empleado: {
                    include: {
                        sucursales: true,
                    },
                },
            },
        });
        if (!usuario_encontrado) {
            throw new common_1.UnauthorizedException("Credenciales inválidas");
        }
        const es_password_valido = await bcrypt.compare(password, usuario_encontrado.password);
        if (!es_password_valido) {
            throw new common_1.UnauthorizedException("Credenciales inválidas");
        }
        const token_payload = {
            sub: usuario_encontrado.id,
            email: usuario_encontrado.email,
            roles: ["admin"],
            sucursales: usuario_encontrado.empleado?.sucursales.map((s) => s.sucursalId) ?? [],
        };
        return {
            access_token: this.jwt_service.sign(token_payload),
            user: {
                id: usuario_encontrado.id,
                email: usuario_encontrado.email,
                nombre: usuario_encontrado.nombre,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);

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
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ServicesService = class ServicesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async catalogo() {
        const servicios = await this.prisma.servicio.findMany({
            where: { activo: true },
            orderBy: { nombre: "asc" },
        });
        return servicios.map((s) => ({
            id: s.id,
            nombre: s.nombre,
            descripcion: s.descripcion,
            precioBase: Number(s.precioBase),
            duracionMinutos: s.duracionMinutos,
            activo: s.activo,
        }));
    }
    async overrides(sucursal_id) {
        if (!sucursal_id)
            return [];
        return this.prisma.servicioSucursal.findMany({
            where: { sucursalId: sucursal_id },
        });
    }
    async crear_override(payload) {
        console.log("TODO: Implementar guardar override", payload);
        return { ...payload, activo: true };
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ServicesService);

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
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AppointmentsService = class AppointmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listar(sucursal_id) {
        const citas = await this.prisma.cita.findMany({
            where: {
                sucursalId: sucursal_id,
            },
            orderBy: {
                fechaHora: "asc",
            },
            include: {
                usuario: {
                    select: { nombre: true, email: true },
                },
                servicio: {
                    select: { nombre: true, duracionMinutos: true },
                },
            },
        });
        return citas.map((cita) => ({
            id: cita.id,
            fechaHora: cita.fechaHora,
            estado: cita.estado,
            cliente: cita.usuario?.nombre ?? "Cliente Anónimo",
            servicio: cita.servicio?.nombre ?? "Servicio Eliminado",
            total: Number(cita.total),
        }));
    }
    async agendar(data, sucursal_id) {
        const servicio = await this.prisma.servicio.findUnique({
            where: { id: data.servicio_id },
        });
        if (!servicio) {
            throw new common_1.BadRequestException("El servicio solicitado no existe");
        }
        return this.prisma.cita.create({
            data: {
                sucursalId: sucursal_id,
                usuarioId: data.usuario_id,
                servicioId: data.servicio_id,
                fechaHora: new Date(data.fecha_hora),
                estado: client_1.CitaEstado.pendiente,
                total: servicio.precioBase,
            },
        });
    }
    async cerrar(cita_id, sucursal_id) {
        return {
            id: cita_id,
            sucursal_id,
            estado: "cerrada",
            mensaje: "Lógica de cierre pendiente de implementar",
        };
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppointmentsService);

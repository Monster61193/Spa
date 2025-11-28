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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsController = void 0;
const common_1 = require("@nestjs/common");
const appointments_service_1 = require("./appointments.service");
const zod_1 = require("zod");
const AgendarSchema = zod_1.z.object({
    usuario_id: zod_1.z.string().uuid(),
    servicio_id: zod_1.z.string().uuid(),
    fecha_hora: zod_1.z.string().datetime(),
});
let AppointmentsController = class AppointmentsController {
    constructor(appointments_service) {
        this.appointments_service = appointments_service;
    }
    async listar(request) {
        const branch_id = request.branchId ?? "branch-principal";
        const items = await this.appointments_service.listar(branch_id);
        return { items };
    }
    async crear(payload, request) {
        const branch_id = request.branchId ?? "branch-principal";
        const datos_validos = AgendarSchema.parse(payload);
        return this.appointments_service.agendar(datos_validos, branch_id);
    }
    async cerrar(payload, request) {
        const branch_id = request.branchId ?? "branch-principal";
        return this.appointments_service.cerrar(payload.citaId, branch_id);
    }
};
exports.AppointmentsController = AppointmentsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "listar", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "crear", null);
__decorate([
    (0, common_1.Post)("close"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AppointmentsController.prototype, "cerrar", null);
exports.AppointmentsController = AppointmentsController = __decorate([
    (0, common_1.Controller)("appointments"),
    __metadata("design:paramtypes", [appointments_service_1.AppointmentsService])
], AppointmentsController);

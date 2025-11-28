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
exports.ServicesController = void 0;
const common_1 = require("@nestjs/common");
const services_service_1 = require("./services.service");
let ServicesController = class ServicesController {
    constructor(services_service) {
        this.services_service = services_service;
    }
    async catalog() {
        const items = await this.services_service.catalogo();
        return { items };
    }
    async overrides(sucursal_id) {
        const overrides = await this.services_service.overrides(sucursal_id);
        return { overrides };
    }
    crear_override(payload) {
        return this.services_service.crear_override(payload);
    }
};
exports.ServicesController = ServicesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ServicesController.prototype, "catalog", null);
__decorate([
    (0, common_1.Get)("overrides"),
    __param(0, (0, common_1.Query)("sucursalId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ServicesController.prototype, "overrides", null);
__decorate([
    (0, common_1.Post)("overrides"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ServicesController.prototype, "crear_override", null);
exports.ServicesController = ServicesController = __decorate([
    (0, common_1.Controller)("services"),
    __metadata("design:paramtypes", [services_service_1.ServicesService])
], ServicesController);

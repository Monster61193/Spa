"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const sample_data_1 = require("../common/mocks/sample-data");
let ServicesService = class ServicesService {
    catalogo() {
        return sample_data_1.services_catalog;
    }
    overrides(sucursalId) {
        if (!sucursalId) {
            return sample_data_1.services_overrides;
        }
        return sample_data_1.services_overrides.filter((override) => override.sucursalId === sucursalId);
    }
    crearOverride(payload) {
        console.log('Creating new override with payload:', payload);
        return { ...payload, activo: true };
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)()
], ServicesService);

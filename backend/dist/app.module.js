"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const appointments_module_1 = require("./appointments/appointments.module");
const auth_module_1 = require("./auth/auth.module");
const audit_module_1 = require("./audit/audit.module");
const branches_module_1 = require("./branches/branches.module");
const commissions_module_1 = require("./commissions/commissions.module");
const inventory_module_1 = require("./inventory/inventory.module");
const notifications_module_1 = require("./notifications/notifications.module");
const points_module_1 = require("./points/points.module");
const prisma_module_1 = require("./prisma/prisma.module");
const promotions_module_1 = require("./promotions/promotions.module");
const services_module_1 = require("./services/services.module");
const branch_guard_1 = require("./common/guards/branch.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '.env.local'] }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            branches_module_1.BranchesModule,
            services_module_1.ServicesModule,
            appointments_module_1.AppointmentsModule,
            inventory_module_1.InventoryModule,
            promotions_module_1.PromotionsModule,
            points_module_1.PointsModule,
            commissions_module_1.CommissionsModule,
            audit_module_1.AuditModule,
            notifications_module_1.NotificationsModule
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: branch_guard_1.BranchGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard }
        ]
    })
], AppModule);

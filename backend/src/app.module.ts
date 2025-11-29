import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { AppointmentsModule } from "./appointments/appointments.module";
import { AuthModule } from "./auth/auth.module";
import { AuditModule } from "./audit/audit.module";
import { BranchesModule } from "./branches/branches.module";
import { CommissionsModule } from "./commissions/commissions.module";
import { InventoryModule } from "./inventory/inventory.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PointsModule } from "./points/points.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PromotionsModule } from "./promotions/promotions.module";
import { ServicesModule } from "./services/services.module";
import { BranchGuard } from "./common/guards/branch.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { UsersModule } from "./users/users.module";

/**
 * Módulo raíz que ensambla todas las capacidades del backend.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", ".env.local"],
    }),
    PrismaModule,
    AuthModule,
    BranchesModule,
    ServicesModule,
    AppointmentsModule,
    InventoryModule,
    PromotionsModule,
    PointsModule,
    CommissionsModule,
    AuditModule,
    NotificationsModule,
    UsersModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: BranchGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { HealthController } from './shared/infra/http/health.controller';
import { PrismaModule } from './shared/infra/prisma/prisma.module';
import { AppExceptionFilter } from './shared/infra/http/filters/app-exception.filter';
import { AuthGuard } from './shared/infra/http/guards/auth.guard';
import { StoreScopeGuard } from './shared/infra/http/guards/store-scope.guard';
import { PermissionGuard } from './shared/infra/http/guards/permission.guard';
import { ServicesModule } from './modules/services/services.module';
import { ProductsModule } from './modules/products/products.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ClientCategoriesModule } from './modules/client-categories/client-categories.module';
import { AppointmentCategoriesModule } from './modules/appointment-categories/appointment-categories.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { FinancialModule } from './modules/financial/financial.module';
import { StorageModule } from './shared/infra/storage/storage.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    TenancyModule,
    ServicesModule,
    ProductsModule,
    ClientCategoriesModule,
    AppointmentCategoriesModule,
    ClientsModule,
    AppointmentsModule,
    SettingsModule,
    FinancialModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: StoreScopeGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_FILTER, useClass: AppExceptionFilter },
  ],
})
export class AppModule {}

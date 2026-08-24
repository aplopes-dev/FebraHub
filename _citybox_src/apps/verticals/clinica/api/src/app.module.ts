import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { MembersModule } from './modules/members/members.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { TeamServiceHoursModule } from './modules/team-service-hours/team-service-hours.module';
import { AuthGuard } from './shared/infra/http/guards/auth.guard';
import { ClinicScopeGuard } from './shared/infra/http/guards/clinic-scope.guard';
import { PermissionGuard } from './shared/infra/http/guards/permission.guard';
import { HealthController } from './shared/infra/http/health.controller';
import { PrismaModule } from './shared/infra/prisma/prisma.module';
import { AppExceptionFilter } from './shared/infra/http/filters/app-exception.filter';
import { StorageModule } from './shared/infra/storage/storage.module';
import { AnamnesisModule } from './modules/anamnesis/anamnesis.module';
import { ClinicProfileModule } from './modules/clinic-profile/clinic-profile.module';
import { ClinicPlansModule } from './modules/clinic-plans/clinic-plans.module';
import { ContractModelsModule } from './modules/contract-models/contract-models.module';
import { PatientsModule } from './modules/patients/patients.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { StockModule } from './modules/stock/stock.module';
import { FinancialModule } from './modules/financial/financial.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SalesModule } from './modules/sales/sales.module';
import { CommissionsModule } from './modules/commissions/commissions.module';
import { MarketingModule } from './modules/marketing/marketing.module';
import { ReportsModule } from './modules/reports/reports.module';
import { StoreSetupModule } from './modules/store-setup/store-setup.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { SignaturesModule } from './modules/signatures/signatures.module';
import { SignaturePackagesModule } from './modules/signature-packages/signature-packages.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    TenancyModule,
    MembersModule,
    TeamServiceHoursModule,
    AnamnesisModule,
    ClinicProfileModule,
    ClinicPlansModule,
    ContractModelsModule,
    PatientsModule,
    SchedulingModule,
    StockModule,
    FinancialModule,
    DashboardModule,
    SalesModule,
    CommissionsModule,
    MarketingModule,
    ReportsModule,
    StoreSetupModule,
    WhatsappModule,
    SignaturesModule,
    SignaturePackagesModule,
    SearchModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: ClinicScopeGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_FILTER, useClass: AppExceptionFilter },
  ],
})
export class AppModule {}

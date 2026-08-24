import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './shared/infra/http/guards/auth.guard';
import { ImoveisScopeGuard } from './shared/infra/http/guards/imoveis-scope.guard';
import { PermissionGuard } from './shared/infra/http/guards/permission.guard';
import { HealthController } from './shared/infra/http/health.controller';
import { PrismaModule } from './shared/infra/prisma/prisma.module';
import { StorageModule } from './shared/infra/storage/storage.module';
import { AppExceptionFilter } from './shared/infra/http/filters/app-exception.filter';
import { MulterExceptionFilter } from './shared/infra/http/filters/multer-exception.filter';
import { LeadsModule } from './modules/leads/leads.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { FinanceModule } from './modules/finance/finance.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SearchModule } from './modules/search/search.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StoreSetupModule } from './modules/store-setup/store-setup.module';
import { DealsModule } from './modules/deals/deals.module';
import { PublicModule } from './modules/public/public.module';
import { MembersModule } from './modules/members/members.module';
import { GoogleCalendarModule } from './modules/google-calendar/google-calendar.module';
import { DocumentTemplatesModule } from './modules/document-templates/document-templates.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    LeadsModule,
    PropertiesModule,
    AppointmentsModule,
    DealsModule,
    TransactionsModule,
    FinanceModule,
    DashboardModule,
    SearchModule,
    RemindersModule,
    SettingsModule,
    StoreSetupModule,
    PublicModule,
    MembersModule,
    GoogleCalendarModule,
    DocumentTemplatesModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: ImoveisScopeGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_FILTER, useClass: MulterExceptionFilter },
    { provide: APP_FILTER, useClass: AppExceptionFilter },
  ],
})
export class AppModule {}

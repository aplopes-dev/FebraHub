import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './shared/infra/http/guards/auth.guard';
import { PermissionGuard } from './shared/infra/http/guards/permission.guard';
import { HealthController } from './shared/infra/http/health.controller';
import { PrismaModule } from './shared/infra/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { StoresModule } from './modules/stores/stores.module';
import { BackofficeModule } from './modules/backoffice/backoffice.module';
import { AuthModule } from './modules/auth/auth.module';
import { CepLookupModule } from './shared/infra/cep-lookup.module';
import { AppExceptionFilter } from './shared/infra/http/filters/app-exception.filter';
import { PlansModule } from './modules/plans/plans.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { MessagingModule } from './shared/infra/messaging/messaging.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

import { EventEmitterModule } from '@nestjs/event-emitter';
import { PaymentGatewayModule } from './modules/payment-gateway/payment-gateway.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    PrismaModule,
    MessagingModule,
    UsersModule,
    StoresModule,
    BackofficeModule,
    CepLookupModule,
    PlansModule,
    SubscriptionsModule,
    InvoicesModule,
    PaymentGatewayModule,
    DashboardModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_FILTER, useClass: AppExceptionFilter },
  ],
})
export class AppModule {}

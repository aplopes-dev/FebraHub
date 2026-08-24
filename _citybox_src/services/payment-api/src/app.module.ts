import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyGuard } from './common/auth/api-key.guard.js';
import { CryptoModule } from './common/crypto/crypto.module.js';
import { IdempotencyModule } from './common/idempotency/idempotency.module.js';
import { CorrelationIdMiddleware } from './common/observability/correlation-id.middleware.js';
import { ObservabilityModule } from './common/observability/observability.module.js';
import { SecurityModule } from './common/security/security.module.js';
import { RateLimitGuard } from './common/redis/rate-limit.guard.js';
import { RedisModule } from './common/redis/redis.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ChargesModule } from './modules/charges/charges.module.js';
import { TapIntentsModule } from './modules/tap-intents/tap-intents.module.js';
import { CustomersModule } from './modules/customers/customers.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { MerchantsModule } from './modules/merchants/merchants.module.js';
import { PaymentMessagingModule } from './modules/messaging/payment-messaging.module.js';
import { PaymentsModule } from './modules/payments/payments.module.js';
import { ProviderAccountsModule } from './modules/provider-accounts/provider-accounts.module.js';
import { ProvidersModule } from './modules/providers/providers.module.js';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module.js';
import { PaymentEntriesModule } from './modules/payment-entries/payment-entries.module.js';
import { SettlementsModule } from './modules/settlements/settlements.module.js';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module.js';
import { SplitsModule } from './modules/splits/splits.module.js';
import { TransfersModule } from './modules/transfers/transfers.module.js';
import { TenantsModule } from './modules/tenants/tenants.module.js';
import { WebhooksModule } from './modules/webhooks/webhooks.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    PrismaModule,
    CryptoModule,
    ObservabilityModule,
    SecurityModule,
    RedisModule,
    IdempotencyModule,
    AuditModule,
    AuthModule,
    PaymentMessagingModule,
    HealthModule,
    ProvidersModule,
    TenantsModule,
    MerchantsModule,
    ProviderAccountsModule,
    CustomersModule,
    ChargesModule,
    TapIntentsModule,
    PaymentsModule,
    PaymentEntriesModule,
    SettlementsModule,
    ReconciliationModule,
    SubscriptionsModule,
    SplitsModule,
    TransfersModule,
    WebhooksModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ApiKeyGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthGuard } from './shared/infra/http/guards/auth.guard';
import { PermissionGuard } from './shared/infra/http/guards/permission.guard';
import { TenantContextGuard } from './shared/infra/tenancy/tenant-context.guard';
import { TenantContextMiddleware } from './shared/infra/tenancy/tenant-context.middleware';
import { HealthController } from './shared/infra/http/health.controller';
import { PrismaModule } from './shared/infra/prisma/prisma.module';
import { StorageModule } from './shared/infra/storage/storage.module';
import { AppExceptionFilter } from './shared/infra/http/filters/app-exception.filter';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CustomersModule } from './modules/customers/customers.module';
import { StockModule } from './modules/stock/stock.module';
import { SalesModule } from './modules/sales/sales.module';
import { FinanceModule } from './modules/finance/finance.module';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import { PosOperatorsModule } from './modules/pos-operators/pos-operators.module';
import { PosPoliciesModule } from './modules/pos-policies/pos-policies.module';
import { PosFiscalSettingsModule } from './modules/pos-fiscal-settings/pos-fiscal-settings.module';
import { FiscalDefaultsModule } from './modules/fiscal-defaults/fiscal-defaults.module';
import { FiscalAdditionalInfoModule } from './modules/fiscal-additional-info/fiscal-additional-info.module';
import { NfseIssuanceModule } from './modules/nfse-issuance/nfse-issuance.module';
import { NfeIssuanceModule } from './modules/nfe-issuance/nfe-issuance.module';
import { OperationNaturesModule } from './modules/operation-natures/operation-natures.module';
import { PosModulesModule } from './modules/pos-modules/pos-modules.module';
import { PosCatalogModule } from './modules/pos-catalog/pos-catalog.module';
import { PosCustomersModule } from './modules/pos-customers/pos-customers.module';
import { PosPaymentMethodsModule } from './modules/pos-payment-methods/pos-payment-methods.module';
import { PosSalesModule } from './modules/pos-sales/pos-sales.module';
import { PosCashSessionsModule } from './modules/pos-cash-sessions/pos-cash-sessions.module';
import { PosDeliveryModule } from './modules/pos-delivery/pos-delivery.module';
import { PosTerminalsModule } from './modules/pos-terminals/pos-terminals.module';
import { CepLookupModule } from './shared/infra/cep-lookup.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';

@Module({
  imports: [
    // Limite de tentativas. **Não** registrado como guard global de propósito:
    // só `pair/redeem` (rota pública, sem credencial) usa `@UseGuards(ThrottlerGuard)`.
    // Global, isto limitaria também as rotas internas de alto volume.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
    PrismaModule,
    StorageModule,
    TenancyModule,
    CatalogModule,
    StockModule,
    CustomersModule,
    SalesModule,
    FinanceModule,
    PosTerminalsModule,
    PosOperatorsModule,
    PosPoliciesModule,
    PosFiscalSettingsModule,
    FiscalDefaultsModule,
    FiscalAdditionalInfoModule,
    NfseIssuanceModule,
    NfeIssuanceModule,
    OperationNaturesModule,
    PosModulesModule,
    PosCatalogModule,
    PosCustomersModule,
    PosPaymentMethodsModule,
    PosCashSessionsModule,
    PosDeliveryModule,
    PosSalesModule,
    CepLookupModule,
    FiscalModule,
  ],
  controllers: [HealthController],
  providers: [
    // A ordem é o pipeline de segurança e vale como contrato:
    // 1. AuthGuard          — quem é o usuário (Keycloak)
    // 2. TenantContextGuard — em qual empresa está e o que pode operar
    // 3. PermissionGuard    — se o papel dele permite esta rota
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: TenantContextGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_FILTER, useClass: AppExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Precisa ser middleware: é ele que abre o AsyncLocalStorage que os guards
    // preenchem e o handler consome (ver tenant-context.middleware.ts).
    // `{*path}` e não `*`: o Express 5 (Nest 11) exige parâmetro nomeado no
    // curinga — `*` sozinho só funciona por auto-conversão, com aviso.
    consumer.apply(TenantContextMiddleware).forRoutes('{*path}');
  }
}

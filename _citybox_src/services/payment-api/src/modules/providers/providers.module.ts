import { Module } from '@nestjs/common';
import { FeatureFlagsModule } from '../../common/feature-flags/feature-flags.module.js';
import { ProviderAccountsModule } from '../provider-accounts/provider-accounts.module.js';
import { AsaasPaymentProvider } from './asaas/asaas-payment.provider.js';
import { AsaasSubscriptionProvider } from './asaas/asaas-subscription.provider.js';
import { PagBankPaymentProvider } from './pagbank/pagbank-payment.provider.js';
import { InfinitePayPaymentProvider } from './infinitepay/infinitepay-payment.provider.js';
import { StonePaymentProvider } from './stone/stone-payment.provider.js';
import { PaymentProviderFactory } from './payment-provider.factory.js';
import { ProviderRoutingService } from './provider-routing.service.js';
import { StubPaymentProvider } from './stub/stub-payment.provider.js';
import { StubSubscriptionProvider } from './stub/stub-subscription.provider.js';

@Module({
  imports: [ProviderAccountsModule, FeatureFlagsModule],
  providers: [
    StubPaymentProvider,
    AsaasPaymentProvider,
    PagBankPaymentProvider,
    InfinitePayPaymentProvider,
    StonePaymentProvider,
    StubSubscriptionProvider,
    AsaasSubscriptionProvider,
    PaymentProviderFactory,
    ProviderRoutingService,
  ],
  exports: [
    PaymentProviderFactory,
    ProviderRoutingService,
    StubPaymentProvider,
    AsaasPaymentProvider,
    PagBankPaymentProvider,
    InfinitePayPaymentProvider,
    StonePaymentProvider,
    StubSubscriptionProvider,
    AsaasSubscriptionProvider,
  ],
})
export class ProvidersModule {}

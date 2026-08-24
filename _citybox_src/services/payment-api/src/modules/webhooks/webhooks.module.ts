import { Module } from '@nestjs/common';
import { PaymentMessagingModule } from '../messaging/payment-messaging.module.js';
import { PaymentEntriesModule } from '../payment-entries/payment-entries.module.js';
import { ProvidersModule } from '../providers/providers.module.js';
import { SettlementsModule } from '../settlements/settlements.module.js';
import { InternalWebhooksModule } from './internal-webhooks.module.js';
import { ProviderWebhookController } from './provider-webhook.controller.js';
import { ProviderWebhookProcessor } from './provider-webhook.processor.js';
import { SubscriptionWebhookProcessor } from './subscription-webhook.processor.js';
import { WebhooksController } from './webhooks.controller.js';
import { WebhooksService } from './webhooks.service.js';

@Module({
  imports: [ProvidersModule, PaymentMessagingModule, PaymentEntriesModule, SettlementsModule, InternalWebhooksModule],
  controllers: [WebhooksController, ProviderWebhookController],
  providers: [WebhooksService, ProviderWebhookProcessor, SubscriptionWebhookProcessor],
  exports: [InternalWebhooksModule, WebhooksService, ProviderWebhookProcessor, SubscriptionWebhookProcessor],
})
export class WebhooksModule {}

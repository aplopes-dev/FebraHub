import { Module } from '@nestjs/common';
import { ProviderAccountsModule } from '../provider-accounts/provider-accounts.module.js';
import { ProvidersModule } from '../providers/providers.module.js';
import { WebhooksModule } from '../webhooks/webhooks.module.js';
import { SubscriptionsController } from './subscriptions.controller.js';
import { SubscriptionsService } from './subscriptions.service.js';

@Module({
  imports: [ProvidersModule, ProviderAccountsModule, WebhooksModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}

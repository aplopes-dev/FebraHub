import { Module } from '@nestjs/common';
import { ProviderAccountsModule } from '../provider-accounts/provider-accounts.module.js';
import { ProvidersModule } from '../providers/providers.module.js';
import { WebhooksModule } from '../webhooks/webhooks.module.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';

@Module({
  imports: [ProvidersModule, ProviderAccountsModule, WebhooksModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}

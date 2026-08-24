import { Module } from '@nestjs/common';
import { PaymentMessagingModule } from '../messaging/payment-messaging.module.js';
import { SplitsModule } from '../splits/splits.module.js';
import { InternalWebhooksModule } from '../webhooks/internal-webhooks.module.js';
import { SettlementsService } from './settlements.service.js';

@Module({
  imports: [PaymentMessagingModule, SplitsModule, InternalWebhooksModule],
  providers: [SettlementsService],
  exports: [SettlementsService],
})
export class SettlementsModule {}

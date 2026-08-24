import { Module } from '@nestjs/common';
import { CryptoModule } from '../../common/crypto/crypto.module.js';
import { PaymentMessagingModule } from '../messaging/payment-messaging.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { InternalWebhookService } from './internal-webhook.service.js';

@Module({
  imports: [CryptoModule, PrismaModule, PaymentMessagingModule],
  providers: [InternalWebhookService],
  exports: [InternalWebhookService],
})
export class InternalWebhooksModule {}

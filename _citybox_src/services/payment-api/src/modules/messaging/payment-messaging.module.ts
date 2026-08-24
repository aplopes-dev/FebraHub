import { Module } from '@nestjs/common';
import { PaymentEventsPublisher } from './payment-events.publisher.js';
import { WebhookDlqPublisher } from './webhook-dlq.publisher.js';

@Module({
  providers: [PaymentEventsPublisher, WebhookDlqPublisher],
  exports: [PaymentEventsPublisher, WebhookDlqPublisher],
})
export class PaymentMessagingModule {}

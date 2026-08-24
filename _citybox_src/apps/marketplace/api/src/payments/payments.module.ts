import { Module } from '@nestjs/common';
import { CheckoutService } from './checkout.service.js';
import { PaymentApiClient } from './payment-api.client.js';
import { PaymentMerchantResolver } from './payment-merchant.resolver.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentWebhookController } from './payment-webhook.controller.js';
import { OrderPaymentSyncService } from './order-payment-sync.service.js';
import { PaymentWebhookSignatureService } from './payment-webhook-signature.service.js';

@Module({
  controllers: [PaymentsController, PaymentWebhookController],
  providers: [
    PaymentApiClient,
    PaymentMerchantResolver,
    CheckoutService,
    OrderPaymentSyncService,
    PaymentWebhookSignatureService,
  ],
  exports: [PaymentApiClient, CheckoutService],
})
export class PaymentsModule {}

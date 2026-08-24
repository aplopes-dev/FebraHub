import { Module, forwardRef } from '@nestjs/common';
import { PAYMENT_GATEWAY } from './domain/providers/payment-gateway.interface';
import { AsaasClient } from './infrastructure/providers/asaas/asaas.client';
import { PaymentGatewayProvider } from './infrastructure/config/payment-gateway.provider';
import { AsaasWebhookRoute } from './infrastructure/http/routes/webhooks/asaas-webhook.route';
import { PaymentGatewayWebhookEventRepository } from './domain/repositories/payment-gateway-webhook-event.repository.interface';
import { PrismaPaymentGatewayWebhookEventRepository } from './infrastructure/database/prisma-payment-gateway-webhook-event.repository';
import { ReceiveAsaasWebhookUseCase } from './application/use-cases/receive-asaas-webhook/receive-asaas-webhook.use-case';
import { PaymentGatewayWebhookListener } from './infrastructure/listeners/payment-gateway-webhook.listener';
import { InvoicesModule } from '../invoices/invoices.module';
import { ListWebhookEventsUseCase } from './application/use-cases/list-webhook-events/list-webhook-events.use-case';
import { PaymentGatewayEventsRoute } from './infrastructure/http/routes/events/payment-gateway-events.route';
import { GetGatewayStatsUseCase } from './application/use-cases/get-gateway-stats/get-gateway-stats.use-case';

@Module({
  imports: [forwardRef(() => InvoicesModule)],
  controllers: [AsaasWebhookRoute, PaymentGatewayEventsRoute],
  providers: [
    AsaasClient,
    PaymentGatewayProvider,
    {
      provide: PaymentGatewayWebhookEventRepository,
      useClass: PrismaPaymentGatewayWebhookEventRepository,
    },
    ReceiveAsaasWebhookUseCase,
    ListWebhookEventsUseCase,
    GetGatewayStatsUseCase,
    PaymentGatewayWebhookListener,
  ],
  exports: [PAYMENT_GATEWAY],
})
export class PaymentGatewayModule {}

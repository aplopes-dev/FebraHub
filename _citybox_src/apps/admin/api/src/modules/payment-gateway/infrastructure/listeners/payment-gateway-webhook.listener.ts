import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentGatewayWebhookEventRepository } from '../../domain/repositories/payment-gateway-webhook-event.repository.interface';
import { ProcessPaymentCreatedUseCase } from '../../../invoices/application/use-cases/process-payment-created/process-payment-created.use-case';
import { ProcessPaymentUpdatedUseCase } from '../../../invoices/application/use-cases/process-payment-updated/process-payment-updated.use-case';
import { ProcessPaymentPaidUseCase } from '../../../invoices/application/use-cases/process-payment-paid/process-payment-paid.use-case';
import { ProcessPaymentOverdueUseCase } from '../../../invoices/application/use-cases/process-payment-overdue/process-payment-overdue.use-case';

@Injectable()
export class PaymentGatewayWebhookListener {
  private readonly logger = new Logger(PaymentGatewayWebhookListener.name);

  constructor(
    private readonly webhookEventRepository: PaymentGatewayWebhookEventRepository,
    private readonly processPaymentCreated: ProcessPaymentCreatedUseCase,
    private readonly processPaymentUpdated: ProcessPaymentUpdatedUseCase,
    private readonly processPaymentPaid: ProcessPaymentPaidUseCase,
    private readonly processPaymentOverdue: ProcessPaymentOverdueUseCase,
  ) {}

  @OnEvent('payment-gateway.webhook.received', { async: true })
  async handleWebhookReceived(event: {
    webhookEventId: string;
  }): Promise<void> {
    const webhookEvent = await this.webhookEventRepository.findById(
      event.webhookEventId,
    );
    if (!webhookEvent) {
      this.logger.error(
        `Webhook event ${event.webhookEventId} não encontrado no banco local.`,
      );
      return;
    }

    if (webhookEvent.status !== 'PENDING') {
      this.logger.warn(
        `Webhook event ${webhookEvent.gatewayEventId} já está com status ${webhookEvent.status}.`,
      );
      return;
    }

    try {
      this.logger.log(
        `Processando webhook event ${webhookEvent.gatewayEventId} (${webhookEvent.eventType})`,
      );

      // Delegate actions to appropriate invoice use cases
      switch (webhookEvent.eventType) {
        case 'PAYMENT_CREATED':
          await this.processPaymentCreated.execute({
            payment: webhookEvent.payload.payment,
          });
          break;
        case 'PAYMENT_UPDATED':
          await this.processPaymentUpdated.execute({
            payment: webhookEvent.payload.payment,
          });
          break;
        case 'PAYMENT_CONFIRMED':
        case 'PAYMENT_RECEIVED':
          await this.processPaymentPaid.execute({
            payment: webhookEvent.payload.payment,
          });
          break;
        case 'PAYMENT_OVERDUE':
          await this.processPaymentOverdue.execute({
            payment: webhookEvent.payload.payment,
          });
          break;
        default:
          this.logger.debug(
            `Evento ${webhookEvent.eventType} não requer ação financeira no momento.`,
          );
      }

      webhookEvent.markAsProcessed();
      await this.webhookEventRepository.save(webhookEvent);

      this.logger.log(
        `Webhook event ${webhookEvent.gatewayEventId} processado com sucesso.`,
      );
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Erro ao processar webhook event ${webhookEvent.gatewayEventId}: ${err.message}`,
        err.stack,
      );

      webhookEvent.markAsFailed(err.message);
      await this.webhookEventRepository.save(webhookEvent);
    }
  }
}

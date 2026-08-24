import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createCloudEvent, RabbitBus, type RabbitConfig } from '@citybox/messaging';
import { getCorrelationId } from '../../common/observability/correlation-id.context.js';
import { PaymentLoggerService } from '../../common/observability/payment-logger.service.js';

export type WebhookDlqPayload = {
  kind: 'internal' | 'provider';
  tenantId?: string;
  deliveryId?: string;
  providerEventId?: string;
  eventType?: string;
  targetUrl?: string;
  provider?: string;
  attempts: number;
  errorMessage: string;
};

@Injectable()
export class WebhookDlqPublisher implements OnModuleInit, OnModuleDestroy {
  private publisher: RabbitBus | null = null;

  constructor(@Inject(PaymentLoggerService) private readonly logger: PaymentLoggerService) {}

  private config(): RabbitConfig | null {
    const url = process.env.RABBITMQ_URL?.trim();
    if (!url) return null;
    return {
      url,
      exchange: process.env.RABBITMQ_EXCHANGE ?? 'citybox.events',
      dlx: process.env.RABBITMQ_DLX ?? 'citybox.dlx',
    };
  }

  async onModuleInit() {
    const cfg = this.config();
    if (!cfg || process.env.PAYMENTS_WEBHOOK_DLQ_PUBLISH === 'false') return;
    this.publisher = new RabbitBus(cfg);
    await this.publisher.connect();
  }

  async onModuleDestroy() {
    await this.publisher?.close();
  }

  async publish(payload: WebhookDlqPayload): Promise<void> {
    if (!this.publisher) {
      this.logger.warn('DLQ RabbitMQ indisponível — webhook morto apenas persistido', 'WebhookDlqPublisher', {
        kind: payload.kind,
        deliveryId: payload.deliveryId,
        providerEventId: payload.providerEventId,
      });
      return;
    }

    const event = createCloudEvent({
      type: 'citybox.payment.webhook.dlq.v1',
      source: 'payment-api',
      data: {
        ...payload,
        correlationId: getCorrelationId(),
      },
    });
    await this.publisher.publish('citybox.payment.webhook.dlq.v1', Buffer.from(JSON.stringify(event)));
    this.logger.warn('Webhook enviado para DLQ', 'WebhookDlqPublisher', {
      kind: payload.kind,
      deliveryId: payload.deliveryId,
      providerEventId: payload.providerEventId,
    });
  }
}

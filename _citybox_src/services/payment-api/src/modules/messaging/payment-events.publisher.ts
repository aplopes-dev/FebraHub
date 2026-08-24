import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createCloudEvent, RabbitBus, type RabbitConfig } from '@citybox/messaging';

export type PaymentCapturedEventData = {
  chargeId: string;
  paymentId: string;
  tenantId: string;
  sourceSystem: string;
  externalReference: string;
  provider: string;
  amount: number;
  netAmount: number;
  paidAt?: string;
  metadata?: Record<string, unknown>;
};

export type PaymentFailedEventData = {
  chargeId: string;
  tenantId: string;
  sourceSystem: string;
  externalReference: string;
  provider: string;
  reason: string;
};

export type PaymentSettledEventData = {
  chargeId: string;
  paymentId: string;
  settlementId: string;
  tenantId: string;
  merchantId: string;
  sourceSystem: string;
  externalReference: string;
  provider: string;
  netAmount: number;
  availableAt: string;
  metadata?: Record<string, unknown>;
  splits?: Array<{ recipientId: string; amount: number; status: string }>;
};

@Injectable()
export class PaymentEventsPublisher implements OnModuleInit, OnModuleDestroy {
  private publisher: RabbitBus | null = null;

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
    if (!cfg || process.env.PAYMENTS_EVENTS_PUBLISH === 'false') return;
    this.publisher = new RabbitBus(cfg);
    await this.publisher.connect();
  }

  async onModuleDestroy() {
    await this.publisher?.close();
  }

  async publishPaymentCaptured(data: PaymentCapturedEventData) {
    await this.publish('citybox.payment.captured.v1', data);
  }

  async publishPaymentFailed(data: PaymentFailedEventData) {
    await this.publish('citybox.payment.failed.v1', data);
  }

  async publishPaymentSettled(data: PaymentSettledEventData) {
    await this.publish('citybox.payment.settled.v1', data);
  }

  private async publish(type: string, data: unknown) {
    if (!this.publisher) return;
    const event = createCloudEvent({
      type,
      source: 'payment-api',
      data,
    });
    await this.publisher.publish(type, Buffer.from(JSON.stringify(event)));
  }
}

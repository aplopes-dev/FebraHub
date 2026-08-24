import { createHmac, randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { EncryptionService } from '../../common/crypto/encryption.service.js';
import { getCorrelationId } from '../../common/observability/correlation-id.context.js';
import { PaymentLoggerService } from '../../common/observability/payment-logger.service.js';
import { PaymentMetricsService } from '../../common/observability/payment-metrics.service.js';
import { assertSafeWebhookUrl } from '../../common/security/webhook-url.js';
import { WebhookDlqPublisher } from '../messaging/webhook-dlq.publisher.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export type InternalWebhookPayload = {
  event: string;
  eventId: string;
  chargeId?: string;
  paymentId?: string;
  sourceSystem: string;
  externalReference: string;
  provider: string;
  status: string;
  amount?: number;
  netAmount?: number;
  paidAt?: string;
  availableAt?: string;
  settlementId?: string;
  metadata?: Record<string, unknown>;
};

const MAX_DELIVERY_ATTEMPTS = Number(process.env.PAYMENTS_WEBHOOK_MAX_ATTEMPTS ?? 3);

@Injectable()
export class InternalWebhookService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(EncryptionService) private readonly encryption: EncryptionService,
    @Inject(PaymentMetricsService) private readonly metrics: PaymentMetricsService,
    @Inject(WebhookDlqPublisher) private readonly dlq: WebhookDlqPublisher,
    @Inject(PaymentLoggerService) private readonly logger: PaymentLoggerService,
  ) {}

  sign(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  async deliver(input: {
    tenantId: string;
    sourceSystem: string;
    eventType: string;
    payload: InternalWebhookPayload;
  }): Promise<void> {
    const hooks = (await this.prisma.db.consumerWebhook.findMany({
      where: {
        tenantId: input.tenantId,
        status: 'ACTIVE',
        OR: [{ sourceSystem: null }, { sourceSystem: input.sourceSystem }],
      },
    })).filter(
      (hook) => hook.eventTypes.length === 0 || hook.eventTypes.includes(input.eventType),
    );

    await Promise.all(
      hooks.map(async (hook) => {
        assertSafeWebhookUrl(hook.url);
        const secret = this.encryption.decrypt(hook.secretEncrypted);
        const body = JSON.stringify(input.payload);
        const signature = this.sign(body, secret);

        const delivery = await this.prisma.db.internalWebhookDelivery.create({
          data: {
            tenantId: input.tenantId,
            targetUrl: hook.url,
            eventType: input.eventType,
            payloadJson: input.payload as object,
            signature,
            status: 'PENDING',
          },
        });

        await this.deliverWithRetry({
          tenantId: input.tenantId,
          deliveryId: delivery.id,
          url: hook.url,
          body,
          signature,
          eventType: input.eventType,
          eventId: input.payload.eventId,
        });
      }),
    );
  }

  private async deliverWithRetry(input: {
    tenantId: string;
    deliveryId: string;
    url: string;
    body: string;
    signature: string;
    eventType: string;
    eventId: string;
  }): Promise<void> {
    const timeoutMs = Number(process.env.PAYMENTS_WEBHOOK_TIMEOUT_MS ?? 5000);
    let lastError = 'delivery failed';
    let lastStatus: number | undefined;
    const correlationId = getCorrelationId();

    for (let attempt = 1; attempt <= MAX_DELIVERY_ATTEMPTS; attempt += 1) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Payments-Signature': input.signature,
          'X-Payments-Event': input.eventType,
          'X-Payments-Event-Id': input.eventId,
        };
        if (correlationId) headers['X-Correlation-Id'] = correlationId;

        const response = await fetch(input.url, {
          method: 'POST',
          headers,
          body: input.body,
          signal: AbortSignal.timeout(timeoutMs),
        });
        const responseBody = await response.text();
        lastStatus = response.status;
        if (response.ok) {
          await this.prisma.db.internalWebhookDelivery.update({
            where: { id: input.deliveryId },
            data: {
              status: 'DELIVERED',
              attempts: attempt,
              lastAttemptAt: new Date(),
              responseStatus: response.status,
              responseBody: responseBody.slice(0, 4000),
            },
          });
          this.logger.info('Webhook interno entregue', 'InternalWebhookService', {
            deliveryId: input.deliveryId,
            eventType: input.eventType,
            attempts: attempt,
          });
          return;
        }
        lastError = responseBody.slice(0, 4000);
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'delivery failed';
      }

      if (attempt < MAX_DELIVERY_ATTEMPTS) {
        await sleep(250 * 2 ** (attempt - 1));
      }
    }

    this.metrics.increment('webhook_failures_total', { kind: 'internal' });

    await this.prisma.db.internalWebhookDelivery.update({
      where: { id: input.deliveryId },
      data: {
        status: 'DEAD_LETTER',
        attempts: MAX_DELIVERY_ATTEMPTS,
        lastAttemptAt: new Date(),
        responseStatus: lastStatus,
        responseBody: lastError,
      },
    });

    await this.dlq.publish({
      kind: 'internal',
      tenantId: input.tenantId,
      deliveryId: input.deliveryId,
      eventType: input.eventType,
      targetUrl: input.url,
      attempts: MAX_DELIVERY_ATTEMPTS,
      errorMessage: lastError,
    });

    this.logger.error('Webhook interno movido para DLQ', 'InternalWebhookService', {
      deliveryId: input.deliveryId,
      eventType: input.eventType,
      responseStatus: lastStatus,
    });
  }

  buildPayload(input: Omit<InternalWebhookPayload, 'eventId'>): InternalWebhookPayload {
    return { ...input, eventId: randomUUID() };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

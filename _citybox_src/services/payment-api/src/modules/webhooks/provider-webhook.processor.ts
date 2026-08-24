import { Inject, Injectable } from '@nestjs/common';
import type { ProviderType } from '../../generated/prisma/enums.js';
import { decimalToNumber } from '../../common/utils/serialization.js';
import { PaymentLoggerService } from '../../common/observability/payment-logger.service.js';
import { PaymentMetricsService } from '../../common/observability/payment-metrics.service.js';
import { AuditLogService } from '../audit/audit.service.js';
import { WebhookDlqPublisher } from '../messaging/webhook-dlq.publisher.js';
import { PaymentEventsPublisher } from '../messaging/payment-events.publisher.js';
import { PaymentEntriesService } from '../payment-entries/payment-entries.service.js';
import { SettlementsService } from '../settlements/settlements.service.js';
import { PaymentProviderFactory } from '../providers/payment-provider.factory.js';
import {
  isProviderPaidChargeStatus,
  mapProviderEventToChargeStatus,
  mapProviderEventToInternalWebhook,
  mapProviderToPaymentStatus,
} from '../providers/provider-status.mapper.js';
import { InternalWebhookService } from './internal-webhook.service.js';
import { SubscriptionWebhookProcessor } from './subscription-webhook.processor.js';
import { readChargeMetadata } from '../../common/utils/charge-metadata.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ProviderWebhookProcessor {
  private readonly processing = new Set<string>();

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PaymentProviderFactory) private readonly providerFactory: PaymentProviderFactory,
    @Inject(InternalWebhookService) private readonly internalWebhooks: InternalWebhookService,
    @Inject(PaymentEventsPublisher) private readonly events: PaymentEventsPublisher,
    @Inject(PaymentEntriesService) private readonly paymentEntries: PaymentEntriesService,
    @Inject(SettlementsService) private readonly settlements: SettlementsService,
    @Inject(SubscriptionWebhookProcessor) private readonly subscriptionWebhooks: SubscriptionWebhookProcessor,
    @Inject(AuditLogService) private readonly audit: AuditLogService,
    @Inject(PaymentMetricsService) private readonly metrics: PaymentMetricsService,
    @Inject(WebhookDlqPublisher) private readonly dlq: WebhookDlqPublisher,
    @Inject(PaymentLoggerService) private readonly logger: PaymentLoggerService,
  ) {}

  enqueue(eventId: string) {
    setImmediate(() => {
      void this.process(eventId).catch((error) => {
        this.logger.error('Falha ao processar webhook PSP', 'ProviderWebhookProcessor', {
          eventId,
          error: error instanceof Error ? error.message : 'unknown',
        });
      });
    });
  }

  async process(eventId: string) {
    if (this.processing.has(eventId)) return;
    this.processing.add(eventId);
    let providerRef: ProviderType | undefined;
    try {
      const stored = await this.prisma.db.providerWebhookEvent.findUnique({ where: { id: eventId } });
      if (!stored || stored.status === 'PROCESSED') return;
      providerRef = stored.provider;

      await this.prisma.db.providerWebhookEvent.update({
        where: { id: eventId },
        data: { status: 'PROCESSING' },
      });

      const provider = this.providerFactory.getProvider(stored.provider);
      const normalized = await provider.parseWebhook({
        headers: (stored.headersJson ?? {}) as Record<string, string>,
        rawBody: stored.rawPayload,
      });

      if (
        normalized.subscriptionEvent ||
        (normalized.providerSubscriptionId &&
          normalized.eventType.startsWith('SUBSCRIPTION_'))
      ) {
        await this.subscriptionWebhooks.handle(stored.provider, normalized);
        await this.prisma.db.providerWebhookEvent.update({
          where: { id: eventId },
          data: { status: 'PROCESSED', processedAt: new Date(), errorMessage: null },
        });
        return;
      }

      if (!normalized.providerChargeId && !normalized.providerOrderId) {
        throw new Error('Webhook sem referência de cobrança');
      }

      const charge = await this.findChargeByProviderRefs(normalized);
      if (!charge) {
        await this.markProcessed(eventId, 'Charge não encontrada — ignorado');
        return;
      }

      const chargeStatus = mapProviderEventToChargeStatus(
        stored.provider,
        normalized.eventType,
        normalized.status,
      ) as never;

      const updatedCharge = await this.prisma.db.charge.update({
        where: { id: charge.id },
        data: {
          status: chargeStatus,
          providerPaymentId: normalized.providerPaymentId ?? charge.providerPaymentId,
          rawProviderPayload: normalized.rawPayload as object,
        },
      });

      let paymentId: string | undefined;
      if (isProviderPaidChargeStatus(stored.provider, chargeStatus)) {
        const gross = normalized.amount ?? decimalToNumber(charge.amount);
        const existing = await this.prisma.db.payment.findFirst({
          where: { chargeId: charge.id, providerPaymentId: normalized.providerPaymentId ?? undefined },
        });
        const payment = existing
          ? await this.prisma.db.payment.update({
              where: { id: existing.id },
              data: {
                status: mapProviderToPaymentStatus(stored.provider, chargeStatus) as never,
                paidAt: normalized.paidAt ? new Date(normalized.paidAt) : new Date(),
                confirmedAt: new Date(),
                rawProviderPayload: normalized.rawPayload as object,
              },
            })
          : await this.prisma.db.payment.create({
              data: {
                chargeId: charge.id,
                provider: charge.provider ?? stored.provider,
                paymentMethod: this.inferPaymentMethod(stored.provider, normalized.rawPayload),
                status: mapProviderToPaymentStatus(stored.provider, chargeStatus) as never,
                grossAmount: gross,
                feeAmount: 0,
                netAmount: gross,
                paidAt: normalized.paidAt ? new Date(normalized.paidAt) : new Date(),
                confirmedAt: new Date(),
                providerPaymentId: normalized.providerPaymentId,
                rawProviderPayload: normalized.rawPayload as object,
              },
            });
        paymentId = payment.id;

        this.metrics.increment('payments_received_total', {
          provider: charge.provider ?? stored.provider,
        });

        await this.paymentEntries.recordCapture({
          tenantId: charge.tenantId,
          paymentId: payment.id,
          chargeId: charge.id,
          provider: charge.provider ?? stored.provider,
          grossAmount: gross,
          providerReference: normalized.providerPaymentId,
          occurredAt: payment.paidAt ?? new Date(),
        });

        await this.settlements.createPendingForPayment({
          tenantId: charge.tenantId,
          merchantId: charge.merchantId,
          paymentId: payment.id,
          provider: charge.provider ?? stored.provider,
          paymentMethod: this.inferPaymentMethod(stored.provider, normalized.rawPayload),
          grossAmount: decimalToNumber(payment.grossAmount),
          feeAmount: decimalToNumber(payment.feeAmount),
          netAmount: decimalToNumber(payment.netAmount),
          paidAt: payment.paidAt ?? undefined,
        });

        await this.events.publishPaymentCaptured({
          chargeId: charge.id,
          paymentId: payment.id,
          tenantId: charge.tenantId,
          sourceSystem: charge.sourceSystem,
          externalReference: charge.externalReference,
          provider: charge.provider ?? stored.provider,
          amount: decimalToNumber(payment.grossAmount),
          netAmount: decimalToNumber(payment.netAmount),
          paidAt: payment.paidAt?.toISOString(),
          metadata: readChargeMetadata(charge),
        });
      } else if (
        stored.provider === 'PAGBANK' &&
        ['FAILED', 'CANCELLED'].includes(chargeStatus)
      ) {
        this.metrics.increment('payments_failed_total', {
          provider: charge.provider ?? stored.provider,
        });
        await this.events.publishPaymentFailed({
          chargeId: charge.id,
          tenantId: charge.tenantId,
          sourceSystem: charge.sourceSystem,
          externalReference: charge.externalReference,
          provider: charge.provider ?? stored.provider,
          reason: chargeStatus,
        });
      }

      const internalEvent = mapProviderEventToInternalWebhook(
        stored.provider,
        normalized.eventType,
        normalized.status,
      );
      await this.internalWebhooks.deliver({
        tenantId: charge.tenantId,
        sourceSystem: charge.sourceSystem,
        eventType: internalEvent,
        payload: this.internalWebhooks.buildPayload({
          event: internalEvent,
          chargeId: updatedCharge.id,
          paymentId,
          sourceSystem: charge.sourceSystem,
          externalReference: charge.externalReference,
          provider: charge.provider ?? stored.provider,
          status: updatedCharge.status,
          amount: decimalToNumber(updatedCharge.amount),
          paidAt: normalized.paidAt,
          metadata: readChargeMetadata(charge),
        }),
      });

      await this.audit.log({
        tenantId: charge.tenantId,
        actor: stored.provider,
        action: 'provider.webhook.processed',
        resourceType: 'charge',
        resourceId: charge.id,
        metadata: { eventType: normalized.eventType, eventId: stored.eventId },
      });

      await this.prisma.db.providerWebhookEvent.update({
        where: { id: eventId },
        data: { status: 'PROCESSED', processedAt: new Date(), errorMessage: null },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'process failed';
      this.metrics.increment('webhook_failures_total', { kind: 'provider', provider: providerRef });
      await this.prisma.db.providerWebhookEvent.update({
        where: { id: eventId },
        data: {
          status: 'FAILED',
          errorMessage,
        },
      });
      await this.dlq.publish({
        kind: 'provider',
        providerEventId: eventId,
        provider: providerRef,
        attempts: 1,
        errorMessage,
      });
      throw error;
    } finally {
      this.processing.delete(eventId);
    }
  }

  private async findChargeByProviderRefs(normalized: {
    providerChargeId?: string;
    providerOrderId?: string;
    eventId?: string;
  }) {
    const refs = [
      normalized.providerChargeId,
      normalized.providerOrderId,
      normalized.eventId,
    ].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);

    return this.prisma.db.charge.findFirst({
      where: {
        OR: refs.flatMap((ref) => [
          { providerChargeId: ref },
          { providerOrderId: ref },
          { externalReference: ref },
        ]),
      },
    });
  }

  private async markProcessed(eventId: string, message: string) {
    await this.prisma.db.providerWebhookEvent.update({
      where: { id: eventId },
      data: { status: 'IGNORED', processedAt: new Date(), errorMessage: message },
    });
  }

  private inferPaymentMethod(provider: ProviderType, raw: unknown): string {
    if (provider === 'ASAAS') {
      const payment = (raw as { payment?: { billingType?: string } })?.payment;
      return payment?.billingType ?? 'UNKNOWN';
    }
    if (provider === 'PAGBANK') {
      const charge = (raw as { charges?: Array<{ payment_method?: { type?: string } }> })?.charges?.[0];
      return charge?.payment_method?.type ?? 'UNKNOWN';
    }
    if (provider === 'INFINITE_PAY') {
      const payload = raw as { capture_method?: string };
      if (payload.capture_method === 'pix') return 'PIX';
      if (payload.capture_method === 'credit_card') return 'CREDIT_CARD';
      if (payload.capture_method === 'debit_card') return 'DEBIT_CARD';
      return 'UNKNOWN';
    }
    if (provider === 'STONE') {
      const payload = raw as { payment_method?: string };
      if (payload.payment_method === 'pix') return 'PIX';
      if (payload.payment_method === 'card') return 'CREDIT_CARD';
      return 'UNKNOWN';
    }
    return 'UNKNOWN';
  }
}

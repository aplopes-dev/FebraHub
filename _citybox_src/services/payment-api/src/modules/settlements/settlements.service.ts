import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ProviderType, SettlementStatus } from '../../generated/prisma/enums.js';
import { decimalToNumber } from '../../common/utils/serialization.js';
import { settlementDaysForMethod } from '../payment-entries/payment-fees.util.js';
import { PaymentEventsPublisher } from '../messaging/payment-events.publisher.js';
import { SplitsService } from '../splits/splits.service.js';
import { InternalWebhookService } from '../webhooks/internal-webhook.service.js';
import { readChargeMetadata } from '../../common/utils/charge-metadata.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class SettlementsService {
  private readonly logger = new Logger(SettlementsService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PaymentEventsPublisher) private readonly events: PaymentEventsPublisher,
    @Inject(SplitsService) private readonly splits: SplitsService,
    @Inject(InternalWebhookService) private readonly internalWebhooks: InternalWebhookService,
  ) {}

  async createPendingForPayment(input: {
    tenantId: string;
    merchantId: string;
    paymentId: string;
    provider: ProviderType;
    paymentMethod: string;
    grossAmount: number;
    feeAmount: number;
    netAmount: number;
    paidAt?: Date;
  }) {
    const existing = await this.prisma.db.settlement.findUnique({
      where: { paymentId: input.paymentId },
    });
    if (existing) return existing;

    const baseDate = input.paidAt ?? new Date();
    const expectedAvailableAt = new Date(baseDate);
    expectedAvailableAt.setDate(
      expectedAvailableAt.getDate() + settlementDaysForMethod(input.paymentMethod),
    );

    return this.prisma.db.settlement.create({
      data: {
        tenantId: input.tenantId,
        merchantId: input.merchantId,
        paymentId: input.paymentId,
        provider: input.provider,
        status: 'PENDING',
        grossAmount: input.grossAmount,
        feeAmount: input.feeAmount,
        netAmount: input.netAmount,
        expectedAvailableAt,
      },
    });
  }

  async processDueSettlements(referenceDate = new Date()) {
    const due = await this.prisma.db.settlement.findMany({
      where: {
        status: 'PENDING',
        expectedAvailableAt: { lte: referenceDate },
      },
      include: {
        payment: {
          include: {
            charge: true,
          },
        },
      },
      take: 500,
    });

    const batchSize = Number(process.env.PAYMENTS_SETTLEMENT_BATCH_SIZE ?? 10);
    const results = [];
    for (let index = 0; index < due.length; index += batchSize) {
      const batch = due.slice(index, index + batchSize);
      const batchResults = await Promise.all(
        batch.map((settlement) => this.processOneSettlement(settlement, referenceDate)),
      );
      results.push(...batchResults);
    }
    return results;
  }

  private async processOneSettlement(
    settlement: {
      id: string;
      tenantId: string;
      paymentId: string;
      provider: ProviderType;
      netAmount: { toString(): string };
      payment: {
        charge: {
          id: string;
          merchantId: string;
          sourceSystem: string;
          externalReference: string;
          metadataJson?: unknown;
        };
      };
    },
    referenceDate: Date,
  ) {
    const updated = await this.prisma.db.$transaction(async (tx) => {
      const available = await tx.settlement.update({
        where: { id: settlement.id },
        data: {
          status: 'AVAILABLE',
          availableAt: referenceDate,
        },
      });
      await tx.payment.update({
        where: { id: settlement.paymentId },
        data: {
          status: 'AVAILABLE',
          availableAt: referenceDate,
        },
      });
      return available;
    });

    const charge = settlement.payment.charge;
    await this.splits.markCompletedForCharge(charge.id);
    const splitRows = await this.splits.listByCharge(settlement.tenantId, charge.id);

    const chargeMetadata = readChargeMetadata(charge);
    const eventPayload = {
      chargeId: charge.id,
      paymentId: settlement.paymentId,
      settlementId: updated.id,
      tenantId: settlement.tenantId,
      merchantId: charge.merchantId,
      sourceSystem: charge.sourceSystem,
      externalReference: charge.externalReference,
      provider: settlement.provider,
      netAmount: decimalToNumber(updated.netAmount),
      availableAt: referenceDate.toISOString(),
      metadata: chargeMetadata,
      splits: splitRows.map((split) => ({
        recipientId: split.recipientId,
        amount: split.amount ?? 0,
        status: split.status,
      })),
    };

    try {
      await this.events.publishPaymentSettled(eventPayload);
    } catch (error) {
      this.logger.warn(
        `Falha ao publicar payment.settled para settlement ${updated.id}`,
        error instanceof Error ? error.message : error,
      );
    }

    try {
      await this.internalWebhooks.deliver({
        tenantId: settlement.tenantId,
        sourceSystem: charge.sourceSystem,
        eventType: 'payment.payment.settled',
        payload: this.internalWebhooks.buildPayload({
          event: 'payment.payment.settled',
          chargeId: charge.id,
          paymentId: settlement.paymentId,
          settlementId: updated.id,
          sourceSystem: charge.sourceSystem,
          externalReference: charge.externalReference,
          provider: settlement.provider,
          status: 'AVAILABLE',
          netAmount: decimalToNumber(updated.netAmount),
          availableAt: referenceDate.toISOString(),
          metadata: chargeMetadata,
        }),
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao entregar webhook interno settled ${updated.id}`,
        error instanceof Error ? error.message : error,
      );
    }

    return updated;
  }

  async list(tenantId: string, status?: string) {
    const normalizedStatus = parseSettlementStatus(status);
    const rows = await this.prisma.db.settlement.findMany({
      where: {
        tenantId,
        ...(normalizedStatus ? { status: normalizedStatus } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => this.toResponse(row));
  }

  private toResponse(row: {
    id: string;
    paymentId: string;
    status: string;
    grossAmount: { toString(): string };
    feeAmount: { toString(): string };
    netAmount: { toString(): string };
    expectedAvailableAt: Date | null;
    availableAt: Date | null;
    settledAt: Date | null;
    provider: string;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      paymentId: row.paymentId,
      status: row.status,
      provider: row.provider,
      grossAmount: decimalToNumber(row.grossAmount),
      feeAmount: decimalToNumber(row.feeAmount),
      netAmount: decimalToNumber(row.netAmount),
      expectedAvailableAt: row.expectedAvailableAt?.toISOString(),
      availableAt: row.availableAt?.toISOString(),
      settledAt: row.settledAt?.toISOString(),
      createdAt: row.createdAt.toISOString(),
    };
  }
}

function parseSettlementStatus(status?: string): SettlementStatus | undefined {
  if (!status) return undefined;
  const allowed = new Set<string>(['PENDING', 'AVAILABLE', 'SETTLED', 'FAILED']);
  if (!allowed.has(status)) return undefined;
  return status as SettlementStatus;
}

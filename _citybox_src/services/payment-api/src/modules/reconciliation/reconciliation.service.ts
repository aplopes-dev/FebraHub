import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { ProviderType } from '../../generated/prisma/enums.js';
import { decimalToNumber, parseOptionalDate } from '../../common/utils/serialization.js';
import { toJson } from '../../common/utils/prisma-json.js';
import { PaymentMetricsService } from '../../common/observability/payment-metrics.service.js';
import { AuditLogService } from '../audit/audit.service.js';
import { InternalWebhookService } from '../webhooks/internal-webhook.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ImportReconciliationDto, MarkDivergentDto, MatchReconciliationDto } from './dto/reconciliation.dto.js';
import {
  amountsMatch,
  sameCalendarDay,
} from '../payment-entries/payment-fees.util.js';
import {
  parseReconciliationCsv,
  reconciliationItemsToCsv,
  type ReconciliationImportRow,
} from './reconciliation.utils.js';

@Injectable()
export class ReconciliationService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditLogService) private readonly audit: AuditLogService,
    @Inject(InternalWebhookService) private readonly webhooks: InternalWebhookService,
    @Inject(PaymentMetricsService) private readonly metrics: PaymentMetricsService,
  ) {}

  async list(
    tenantId: string,
    filters: { status?: string; batchId?: string; format?: string },
  ) {
    const items = await this.prisma.db.reconciliationItem.findMany({
      where: {
        tenantId,
        ...(filters.batchId ? { batchId: filters.batchId } : {}),
        ...(filters.status ? { status: filters.status as never } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const mapped = items.map((item) => this.toItemResponse(item));
    if (filters.format === 'csv') {
      return reconciliationItemsToCsv(
        mapped.map((item) => ({
          ...item,
          transactionDate: item.transactionDate,
        })),
      );
    }

    const batches = await this.prisma.db.reconciliationBatch.findMany({
      where: { tenantId },
      orderBy: { importedAt: 'desc' },
      take: 50,
    });

    return {
      batches: batches.map((batch) => this.toBatchResponse(batch)),
      items: mapped,
    };
  }

  async import(tenantId: string, importedBy: string, dto: ImportReconciliationDto) {
    const rows = this.resolveImportRows(dto);
    if (rows.length === 0) {
      throw new BadRequestException('Nenhuma linha válida para importação');
    }

    const batch = await this.prisma.db.reconciliationBatch.create({
      data: {
        tenantId,
        provider: dto.provider as ProviderType | undefined,
        source: dto.source,
        status: 'PROCESSING',
        fileName: dto.fileName,
        importedBy,
        totalItems: rows.length,
        metadataJson: toJson({ source: dto.source }),
      },
    });

    let matchedCount = 0;
    let divergentCount = 0;

    for (const row of rows) {
      const result = await this.autoMatchRow(tenantId, batch.id, row, dto.provider as ProviderType | undefined);
      if (result.status === 'MATCHED' || result.status === 'RECONCILED') matchedCount += 1;
      if (result.status === 'DIVERGENT' || result.status === 'PARTIALLY_MATCHED') {
        divergentCount += 1;
        this.metrics.increment('reconciliation_divergences_total');
      }
    }

    const completed = await this.prisma.db.reconciliationBatch.update({
      where: { id: batch.id },
      data: {
        status: 'COMPLETED',
        matchedCount,
        divergentCount,
        completedAt: new Date(),
      },
    });

    await this.audit.log({
      tenantId,
      actor: importedBy,
      action: 'reconciliation.imported',
      resourceType: 'reconciliation_batch',
      resourceId: batch.id,
      metadata: { totalItems: rows.length, matchedCount, divergentCount },
    });

    return this.toBatchResponse(completed);
  }

  async match(tenantId: string, itemId: string, actor: string, dto: MatchReconciliationDto) {
    const item = await this.getItem(tenantId, itemId);
    const charge = dto.chargeId
      ? await this.prisma.db.charge.findFirst({ where: { id: dto.chargeId, tenantId } })
      : item.chargeId
        ? await this.prisma.db.charge.findFirst({ where: { id: item.chargeId, tenantId } })
        : null;
    if (!charge) throw new NotFoundException('Charge não encontrada para match manual');

    const payment = dto.paymentId
      ? await this.prisma.db.payment.findFirst({
          where: { id: dto.paymentId, charge: { tenantId } },
        })
      : await this.prisma.db.payment.findFirst({
          where: { chargeId: charge.id },
          orderBy: { createdAt: 'desc' },
        });

    const expectedAmount = payment
      ? decimalToNumber(payment.grossAmount)
      : decimalToNumber(charge.amount);
    const differenceAmount = Math.round((decimalToNumber(item.amount) - expectedAmount) * 100) / 100;
    const status = amountsMatch(expectedAmount, decimalToNumber(item.amount)) ? 'MATCHED' : 'PARTIALLY_MATCHED';

    const updated = await this.prisma.db.reconciliationItem.update({
      where: { id: item.id },
      data: {
        status: status as never,
        chargeId: charge.id,
        paymentId: payment?.id,
        expectedAmount,
        differenceAmount,
        matchedAt: new Date(),
        matchNotes: dto.notes ?? 'Match manual',
      },
    });

    await this.notifyMatch(tenantId, charge.sourceSystem, updated.id, status);
    await this.audit.log({
      tenantId,
      actor,
      action: 'reconciliation.matched',
      resourceType: 'reconciliation_item',
      resourceId: item.id,
      metadata: { chargeId: charge.id, paymentId: payment?.id, status },
    });

    return this.toItemResponse(updated);
  }

  async markDivergent(tenantId: string, itemId: string, actor: string, dto: MarkDivergentDto) {
    const item = await this.getItem(tenantId, itemId);
    const updated = await this.prisma.db.reconciliationItem.update({
      where: { id: item.id },
      data: {
        status: 'DIVERGENT',
        matchNotes: dto.reason ?? 'Marcado como divergente manualmente',
      },
    });

    await this.prisma.db.reconciliationBatch.update({
      where: { id: item.batchId },
      data: { divergentCount: { increment: 1 } },
    });

    this.metrics.increment('reconciliation_divergences_total');

    const charge = item.chargeId
      ? await this.prisma.db.charge.findUnique({ where: { id: item.chargeId } })
      : null;

    if (charge) {
      await this.webhooks.deliver({
        tenantId,
        sourceSystem: charge.sourceSystem,
        eventType: 'payment.reconciliation.divergent',
        payload: this.webhooks.buildPayload({
          event: 'payment.reconciliation.divergent',
          chargeId: charge.id,
          sourceSystem: charge.sourceSystem,
          externalReference: charge.externalReference,
          provider: charge.provider ?? 'STUB',
          status: 'DIVERGENT',
          amount: decimalToNumber(item.amount),
        }),
      });
    }

    await this.audit.log({
      tenantId,
      actor,
      action: 'reconciliation.mark_divergent',
      resourceType: 'reconciliation_item',
      resourceId: item.id,
      metadata: { reason: dto.reason },
    });

    return this.toItemResponse(updated);
  }

  private resolveImportRows(dto: ImportReconciliationDto): ReconciliationImportRow[] {
    if (dto.rows?.length) {
      return dto.rows.map((row) => ({
        externalReference: row.externalReference,
        providerReference: row.providerReference,
        amount: row.amount,
        transactionDate: row.transactionDate,
        description: row.description,
      }));
    }
    if (dto.csvContent?.trim()) {
      return parseReconciliationCsv(dto.csvContent);
    }
    throw new BadRequestException('Informe rows ou csvContent');
  }

  private async autoMatchRow(
    tenantId: string,
    batchId: string,
    row: ReconciliationImportRow,
    provider?: ProviderType,
  ) {
    const charge = await this.findChargeForRow(tenantId, row, provider);
    const payment = charge
      ? await this.prisma.db.payment.findFirst({
          where: { chargeId: charge.id },
          orderBy: { createdAt: 'desc' },
        })
      : null;

    const expectedAmount = payment
      ? decimalToNumber(payment.grossAmount)
      : charge
        ? decimalToNumber(charge.amount)
        : null;

    let status: 'PENDING' | 'MATCHED' | 'DIVERGENT' | 'PARTIALLY_MATCHED' = 'PENDING';
    let differenceAmount: number | null = null;
    let matchNotes: string | undefined;

    if (charge && expectedAmount != null) {
      differenceAmount = Math.round((row.amount - expectedAmount) * 100) / 100;
      const amountOk = amountsMatch(expectedAmount, row.amount);
      const dateOk =
        !row.transactionDate ||
        !payment?.paidAt ||
        sameCalendarDay(parseOptionalDate(row.transactionDate) ?? payment.paidAt, payment.paidAt);

      if (amountOk && dateOk) {
        status = 'MATCHED';
        matchNotes = 'Match automático por externalReference/valor/data';
      } else if (amountOk) {
        status = 'PARTIALLY_MATCHED';
        matchNotes = 'Valor confere, data divergente';
      } else {
        status = 'DIVERGENT';
        matchNotes = 'Valor divergente';
      }
    } else {
      status = 'DIVERGENT';
      matchNotes = 'Charge/payment não encontrados';
      differenceAmount = expectedAmount != null ? row.amount - expectedAmount : null;
    }

    const item = await this.prisma.db.reconciliationItem.create({
      data: {
        batchId,
        tenantId,
        externalReference: row.externalReference,
        providerReference: row.providerReference,
        amount: row.amount,
        transactionDate: parseOptionalDate(row.transactionDate),
        status: status as never,
        chargeId: charge?.id,
        paymentId: payment?.id,
        expectedAmount: expectedAmount ?? undefined,
        differenceAmount: differenceAmount ?? undefined,
        matchedAt: status === 'MATCHED' ? new Date() : undefined,
        matchNotes,
        metadataJson: toJson({ description: row.description }),
      },
    });

    if (status === 'MATCHED' && charge) {
      await this.notifyMatch(tenantId, charge.sourceSystem, item.id, status);
    }
    if (status === 'DIVERGENT' && charge) {
      await this.webhooks.deliver({
        tenantId,
        sourceSystem: charge.sourceSystem,
        eventType: 'payment.reconciliation.divergent',
        payload: this.webhooks.buildPayload({
          event: 'payment.reconciliation.divergent',
          chargeId: charge.id,
          sourceSystem: charge.sourceSystem,
          externalReference: charge.externalReference,
          provider: charge.provider ?? 'STUB',
          status: 'DIVERGENT',
          amount: row.amount,
        }),
      });
    }

    return item;
  }

  private async findChargeForRow(
    tenantId: string,
    row: ReconciliationImportRow,
    provider?: ProviderType,
  ) {
    if (row.externalReference) {
      const byExternal = await this.prisma.db.charge.findFirst({
        where: { tenantId, externalReference: row.externalReference },
        orderBy: { createdAt: 'desc' },
      });
      if (byExternal) return byExternal;
    }

    if (row.providerReference) {
      return this.prisma.db.charge.findFirst({
        where: {
          tenantId,
          ...(provider ? { provider } : {}),
          OR: [
            { providerChargeId: row.providerReference },
            { providerOrderId: row.providerReference },
            { providerPaymentId: row.providerReference },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return null;
  }

  private async notifyMatch(
    tenantId: string,
    sourceSystem: string,
    itemId: string,
    status: string,
  ) {
    await this.webhooks.deliver({
      tenantId,
      sourceSystem,
      eventType: 'payment.reconciliation.matched',
      payload: this.webhooks.buildPayload({
        event: 'payment.reconciliation.matched',
        sourceSystem,
        externalReference: itemId,
        provider: 'STUB',
        status,
        amount: 0,
      }),
    });
  }

  private async getItem(tenantId: string, itemId: string) {
    const item = await this.prisma.db.reconciliationItem.findFirst({
      where: { id: itemId, tenantId },
    });
    if (!item) throw new NotFoundException('Item de conciliação não encontrado');
    return item;
  }

  private toBatchResponse(batch: {
    id: string;
    provider: string | null;
    source: string;
    status: string;
    fileName: string | null;
    totalItems: number;
    matchedCount: number;
    divergentCount: number;
    importedAt: Date;
    completedAt: Date | null;
  }) {
    return {
      id: batch.id,
      provider: batch.provider,
      source: batch.source,
      status: batch.status,
      fileName: batch.fileName,
      totalItems: batch.totalItems,
      matchedCount: batch.matchedCount,
      divergentCount: batch.divergentCount,
      importedAt: batch.importedAt.toISOString(),
      completedAt: batch.completedAt?.toISOString(),
    };
  }

  private toItemResponse(item: {
    id: string;
    batchId: string;
    externalReference: string | null;
    providerReference: string | null;
    amount: { toString(): string };
    expectedAmount: { toString(): string } | null;
    differenceAmount: { toString(): string } | null;
    status: string;
    chargeId: string | null;
    paymentId: string | null;
    transactionDate: Date | null;
    matchedAt: Date | null;
    matchNotes: string | null;
    createdAt: Date;
  }) {
    return {
      id: item.id,
      batchId: item.batchId,
      externalReference: item.externalReference,
      providerReference: item.providerReference,
      amount: decimalToNumber(item.amount),
      expectedAmount: item.expectedAmount ? decimalToNumber(item.expectedAmount) : null,
      differenceAmount: item.differenceAmount ? decimalToNumber(item.differenceAmount) : null,
      status: item.status,
      chargeId: item.chargeId,
      paymentId: item.paymentId,
      transactionDate: item.transactionDate?.toISOString().slice(0, 10) ?? null,
      matchedAt: item.matchedAt?.toISOString(),
      matchNotes: item.matchNotes,
      createdAt: item.createdAt.toISOString(),
    };
  }
}

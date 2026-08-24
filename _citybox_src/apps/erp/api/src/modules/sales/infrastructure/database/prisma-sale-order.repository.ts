import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import type { ScopedTransactionClient } from '../../../../shared/infra/prisma/prisma.service';
import { SaleOrder } from '../../domain/entities/sale-order.entity';
import type {
  SaleOrder as SaleOrderEntity,
  SaleOrderCardPaymentType,
} from '../../domain/entities/sale-order.entity';
import type { StockMovement } from '../../../stock/domain/entities/stock-movement.entity';
import { persistStockMovementInTx } from '../../../stock/infrastructure/database/persist-stock-movement-in-tx';
import {
  SaleOrderRepository,
  type SaleOrderDetail,
  type SaleOrderListCriteria,
  type SaleOrderListItem,
  type SaleOrderSortOption,
  type SaveSaleOrderPosMeta,
} from '../../domain/repositories/sale-order.repository.interface';
import { calculateCardSettlement } from '../../../finance/card-contracts/domain/services/card-settlement-calculator';
import { resolveCardSettlement } from './resolve-card-settlement';

type SaleOrderRow = {
  id: string;
  organizationId: string;
  number: number;
  customerId: string | null;
  customerName: string;
  consumerDocument: string | null;
  stockId: string | null;
  status: string;
  channelId: string;
  sellerId: string | null;
  sellerName: string;
  createdByName: string;
  notes: string;
  deliveryFeeCents: number;
  discountsCents: number;
  stockMovementId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lines: Array<{
    productId: string | null;
    description: string | null;
    quantity: Prisma.Decimal;
    unitPriceCents: number;
  }>;
  payments: Array<{
    id: string;
    amountCents: number;
    methodId: string;
    bankAccountId: string | null;
    cardPaymentType: SaleOrderCardPaymentType | null;
    brand: string | null;
    installments: number | null;
  }>;
};

/**
 * Usa `prisma.scoped`: o filtro global injeta o `organizationId` do contexto
 * em toda query, mesmo nas que já o passam explicitamente aqui.
 */
@Injectable()
export class PrismaSaleOrderRepository extends SaleOrderRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async nextNumber(organizationId: string): Promise<number> {
    const result = await this.prisma.scoped.saleOrder.aggregate({
      where: { organizationId },
      _max: { number: true },
    });
    return (result._max.number ?? 0) + 1;
  }

  async saveWithOptionalMovement(
    saleOrder: SaleOrder,
    movement: StockMovement | null,
    posMeta?: SaveSaleOrderPosMeta,
  ): Promise<SaleOrder> {
    const finalSaleOrder = movement
      ? saleOrder.withStockMovementId(movement.id)
      : saleOrder;

    const data = {
      organizationId: finalSaleOrder.organizationId,
      number: finalSaleOrder.number,
      customerId: finalSaleOrder.customerId,
      customerName: finalSaleOrder.customerName,
      consumerDocument: finalSaleOrder.consumerDocument,
      stockId: finalSaleOrder.stockId,
      status: finalSaleOrder.status,
      channelId: finalSaleOrder.channelId,
      sellerId: finalSaleOrder.sellerId,
      sellerName: finalSaleOrder.sellerName,
      createdByName: finalSaleOrder.createdByName,
      notes: finalSaleOrder.notes,
      deliveryFeeCents: finalSaleOrder.deliveryFeeCents,
      discountsCents: finalSaleOrder.discountsCents,
      totalCents: finalSaleOrder.totalCents,
      stockMovementId: finalSaleOrder.stockMovementId,
      deletedAt: finalSaleOrder.deletedAt,
      updatedAt: finalSaleOrder.updatedAt,
    };

    const posCreateFields = posMeta
      ? {
          cashSessionId: posMeta.cashSessionId,
          posTerminalId: posMeta.posTerminalId,
          operatorUserId: posMeta.operatorUserId,
          ...(posMeta.posDeliveryOrderId
            ? { posDeliveryOrderId: posMeta.posDeliveryOrderId }
            : {}),
        }
      : {};

    await this.prisma.scoped.$transaction(async (tx) => {
      await tx.saleOrder.upsert({
        where: { id: finalSaleOrder.id },
        create: {
          id: finalSaleOrder.id,
          ...data,
          ...posCreateFields,
          createdAt: finalSaleOrder.createdAt,
        },
        update: data,
      });

      // Substituição completa (semântica de PUT) — inclusive na criação,
      // onde o delete não encontra nada a apagar.
      await tx.saleOrderLine.deleteMany({
        where: {
          saleOrderId: finalSaleOrder.id,
          organizationId: finalSaleOrder.organizationId,
        },
      });
      await tx.saleOrderLine.createMany({
        data: finalSaleOrder.lines.map((line) => ({
          organizationId: finalSaleOrder.organizationId,
          saleOrderId: finalSaleOrder.id,
          productId: line.productId,
          description: line.description,
          quantity: new Prisma.Decimal(line.quantity),
          unitPriceCents: line.unitPriceCents,
        })),
      });

      await tx.saleOrderPayment.deleteMany({
        where: {
          saleOrderId: finalSaleOrder.id,
          organizationId: finalSaleOrder.organizationId,
        },
      });
      // `payment.id` fica `undefined` em memória para pagamentos novos até
      // este ponto — resolve aqui, uma única vez, e reaproveita o mesmo id
      // tanto na gravação quanto no motor de recebíveis logo abaixo (que
      // precisa do id real para `FinancialEntry.saleOrderPaymentId`).
      const paymentsWithResolvedIds = finalSaleOrder.payments.map(
        (payment) => ({
          ...payment,
          id: payment.id ?? randomUUID(),
        }),
      );
      if (paymentsWithResolvedIds.length) {
        await tx.saleOrderPayment.createMany({
          data: paymentsWithResolvedIds.map((payment) => ({
            id: payment.id,
            organizationId: finalSaleOrder.organizationId,
            saleOrderId: finalSaleOrder.id,
            amountCents: payment.amountCents,
            methodId: payment.methodId,
            bankAccountId: payment.bankAccountId,
            cardPaymentType: payment.cardPaymentType ?? null,
            brand: payment.brand ?? null,
            installments: payment.installments ?? null,
          })),
        });
      }

      if (movement) await persistStockMovementInTx(tx, movement);
      await this.maybeCreateReceivable(
        tx,
        finalSaleOrder,
        paymentsWithResolvedIds,
      );

      // Vínculo delivery já vai em `posCreateFields` (posDeliveryOrderId).
      // Pagamento NÃO avança status operacional para `delivered` — Concluído
      // no Kanban é só o ciclo físico (received → … → delivered).
      // Unique parcial impede segunda venda ativa no mesmo pedido.
    });

    return finalSaleOrder;
  }

  async softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void> {
    await this.prisma.scoped.saleOrder.update({
      where: { id, organizationId },
      data: { deletedAt },
    });
  }

  async clearDeletedAt(
    organizationId: string,
    id: string,
    updatedAt: Date,
  ): Promise<void> {
    await this.prisma.scoped.saleOrder.update({
      where: { id, organizationId },
      data: { deletedAt: null, updatedAt },
    });
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<SaleOrderDetail | null> {
    const row = await this.prisma.scoped.saleOrder.findFirst({
      where: { id, organizationId },
      include: {
        lines: { include: { product: { select: { name: true, sku: true } } } },
        payments: true,
        stock: { select: { name: true } },
        posDeliveryOrder: {
          select: { id: true, number: true, fulfillment: true },
        },
      },
    });
    if (!row) return null;

    return {
      saleOrder: this.toEntity(row),
      stockName: row.stock?.name ?? null,
      posDeliveryOrderId:
        row.posDeliveryOrderId ?? row.posDeliveryOrder?.id ?? null,
      posDeliveryOrderNumber: row.posDeliveryOrder?.number ?? null,
      posDeliveryFulfillment: row.posDeliveryOrder?.fulfillment ?? null,
      lines: row.lines.map((line) => {
        const qty = Number(line.quantity);
        return {
          productId: line.productId,
          // Linha de serviço (sem produto vinculado) não tem join —
          // `productName`/`productSku` ficam `null` (spec erp/031 D1).
          productName: line.product?.name ?? null,
          productSku: line.product?.sku ?? null,
          description: line.description,
          quantity: line.quantity.toString(),
          unitPriceCents: line.unitPriceCents,
          subtotalCents: Math.round(qty * line.unitPriceCents),
        };
      }),
    };
  }

  async findAll(
    organizationId: string,
    criteria: SaleOrderListCriteria = {},
  ): Promise<SaleOrderListItem[]> {
    const rows = await this.prisma.scoped.saleOrder.findMany({
      where: this.buildWhere(organizationId, criteria),
      include: {
        lines: true,
        payments: true,
        stock: { select: { name: true } },
        posDeliveryOrder: {
          select: { id: true, number: true, fulfillment: true },
        },
      },
      orderBy: this.buildOrderBy(criteria.sort),
      skip: criteria.skip,
      take: criteria.take,
    });

    return rows.map((row) => ({
      saleOrder: this.toEntity(row),
      stockName: row.stock?.name ?? null,
      posDeliveryOrderId:
        row.posDeliveryOrderId ?? row.posDeliveryOrder?.id ?? null,
      posDeliveryOrderNumber: row.posDeliveryOrder?.number ?? null,
      posDeliveryFulfillment: row.posDeliveryOrder?.fulfillment ?? null,
    }));
  }

  count(
    organizationId: string,
    criteria: Omit<SaleOrderListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.prisma.scoped.saleOrder.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async countByTabs(
    organizationId: string,
  ): Promise<{ open: number; deleted: number }> {
    const [open, deleted] = await Promise.all([
      this.prisma.scoped.saleOrder.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.scoped.saleOrder.count({
        where: { organizationId, deletedAt: { not: null } },
      }),
    ]);
    return { open, deleted };
  }

  /**
   * Motor de recebíveis do contrato de cartões
   * (`specs/erp/005-card-receivables-engine/`). Ao fechar um pedido com
   * pagamentos, gera 1 `FinancialEntry` `receivable` **por pagamento** em
   * cartão/Pix (1 por parcela, taxa da adquirente já descontada, vencimento
   * calculado) — ou, sem contrato/método correspondente, o formato bruto de
   * hoje com um aviso visível (FR-005). Pagamentos sem `cardPaymentType`
   * (dinheiro/boleto/transferência) continuam somados num único
   * `FinancialEntry` agregado, **exatamente** como antes desta entrega
   * (research.md D5) — pedidos pagos só em dinheiro não mudam em nada.
   *
   * Idempotente por `(saleOrderPaymentId, installmentSequence)` para as
   * entradas do motor, e por `saleOrderId` (sem `saleOrderPaymentId`) para o
   * agregado — reprocessar o mesmo fechamento (retry, reenvio do PATCH de
   * status) nunca duplica. Nunca falha o fechamento da venda: qualquer erro
   * de resolução/cálculo de um pagamento cai no fallback daquele pagamento
   * (Orientação #2 do spec).
   *
   * Efeito colateral de infraestrutura, de propósito: nem o domínio de
   * `SaleOrder` nem este repositório importam `FinanceModule` — Prisma
   * direto na mesma transação (decisão registrada em `api/AGENTS.md` §9;
   * research.md D1), mesmo padrão já usado para resolver `ChartOfAccount`/
   * `CostCenter` por `systemKey`.
   */
  private async maybeCreateReceivable(
    tx: ScopedTransactionClient,
    saleOrder: SaleOrder,
    payments: Array<SaleOrderEntity['payments'][number] & { id: string }>,
  ): Promise<void> {
    if (saleOrder.status !== 'closed' || payments.length === 0) {
      return;
    }

    const existingEntries: Array<{
      saleOrderPaymentId: string | null;
      installmentSequence: number | null;
    }> = await tx.financialEntry.findMany({
      where: {
        organizationId: saleOrder.organizationId,
        saleOrderId: saleOrder.id,
      },
      select: { saleOrderPaymentId: true, installmentSequence: true },
    });
    const hasAggregateEntry = existingEntries.some(
      (entry) => entry.saleOrderPaymentId === null,
    );
    const existingCardKeys = new Set(
      existingEntries
        .filter((entry) => entry.saleOrderPaymentId !== null)
        .map(
          (entry) => `${entry.saleOrderPaymentId}:${entry.installmentSequence}`,
        ),
    );

    // Contas/centro de sistema podem faltar em organizações provisionadas
    // antes deste seed existir — não deixar o fechamento do pedido quebrar
    // por isso; o backfill (scripts/backfill-financial-entry-allocations.ts)
    // cobre esses casos depois.
    const [chartOfAccount, costCenter] = await Promise.all([
      tx.chartOfAccount.findFirst({
        where: {
          organizationId: saleOrder.organizationId,
          systemKey: 'vendas-mercadorias',
        },
        select: { id: true },
      }),
      tx.costCenter.findFirst({
        where: {
          organizationId: saleOrder.organizationId,
          systemKey: 'comercial',
        },
        select: { id: true },
      }),
    ]);

    const now = new Date();
    const cardPayments = payments.filter((payment) => payment.cardPaymentType);
    const otherPayments = payments.filter(
      (payment) => !payment.cardPaymentType,
    );

    for (const payment of cardPayments) {
      await this.createCardSettlementEntries(tx, {
        saleOrder,
        payment,
        now,
        existingCardKeys,
        chartOfAccount,
        costCenter,
      });
    }

    const remainderCents = otherPayments.reduce(
      (sum, payment) => sum + payment.amountCents,
      0,
    );
    if (remainderCents > 0 && !hasAggregateEntry) {
      await this.createFinancialEntry(tx, {
        saleOrder,
        amountCents: remainderCents,
        paidCents: remainderCents,
        status: 'paid',
        competenceDate: now,
        dueDate: now,
        bankAccountId: otherPayments[0]?.bankAccountId ?? null,
        saleOrderPaymentId: null,
        installmentSequence: null,
        installmentCount: null,
        cardSettlementFallback: false,
        grossAmountCents: null,
        acquirerFeeCents: null,
        cardContractId: null,
        cardPaymentMethodId: null,
        chartOfAccount,
        costCenter,
      });
    }
  }

  /**
   * Resolve + calcula 1 pagamento em cartão/Pix e grava 1..N `FinancialEntry`
   * (uma por parcela) — ou, sem correspondência (contrato/método ausente) ou
   * diante de qualquer erro de cálculo, 1 único `FinancialEntry` de fallback
   * (bruto, quitado, hoje, `cardSettlementFallback=true`). Nunca propaga
   * exceção — é sempre seguro chamar dentro do laço de `maybeCreateReceivable`.
   */
  private async createCardSettlementEntries(
    tx: ScopedTransactionClient,
    params: {
      saleOrder: SaleOrder;
      payment: SaleOrderEntity['payments'][number] & { id: string };
      now: Date;
      existingCardKeys: Set<string>;
      chartOfAccount: { id: string } | null;
      costCenter: { id: string } | null;
    },
  ): Promise<void> {
    const {
      saleOrder,
      payment,
      now,
      existingCardKeys,
      chartOfAccount,
      costCenter,
    } = params;

    let settlement: {
      installments: ReturnType<typeof calculateCardSettlement>;
      cardContractId: string;
      cardPaymentMethodId: string;
    } | null = null;

    try {
      const resolution = await resolveCardSettlement(tx, {
        organizationId: saleOrder.organizationId,
        bankAccountId: payment.bankAccountId,
        cardPaymentType: payment.cardPaymentType!,
        brand: payment.brand ?? null,
      });

      if (resolution.kind === 'matched') {
        settlement = {
          installments: calculateCardSettlement({
            grossAmountCents: payment.amountCents,
            saleDate: now,
            installments: payment.installments ?? 1,
            method: resolution.method,
            contract: resolution.contract,
          }),
          cardContractId: resolution.cardContractId,
          cardPaymentMethodId: resolution.cardPaymentMethodId,
        };
      }
    } catch {
      // Nunca falha o fechamento da venda por causa do motor (Orientação #2
      // do spec) — contrato mal configurado (ex.: faixa progressiva sem
      // cobertura) cai no mesmo fallback de "sem correspondência".
      settlement = null;
    }

    if (!settlement) {
      const key = `${payment.id}:1`;
      if (existingCardKeys.has(key)) return;

      await this.createFinancialEntry(tx, {
        saleOrder,
        amountCents: payment.amountCents,
        paidCents: payment.amountCents,
        status: 'paid',
        competenceDate: now,
        dueDate: now,
        bankAccountId: payment.bankAccountId,
        saleOrderPaymentId: payment.id,
        installmentSequence: 1,
        installmentCount: 1,
        cardSettlementFallback: true,
        grossAmountCents: null,
        acquirerFeeCents: null,
        cardContractId: null,
        cardPaymentMethodId: null,
        chartOfAccount,
        costCenter,
      });
      return;
    }

    for (const installment of settlement.installments) {
      const key = `${payment.id}:${installment.sequence}`;
      if (existingCardKeys.has(key)) continue;

      await this.createFinancialEntry(tx, {
        saleOrder,
        amountCents: installment.netAmountCents,
        paidCents: 0,
        status: 'pending',
        competenceDate: now,
        dueDate: installment.dueDate,
        bankAccountId: payment.bankAccountId,
        saleOrderPaymentId: payment.id,
        installmentSequence: installment.sequence,
        installmentCount: settlement.installments.length,
        cardSettlementFallback: false,
        grossAmountCents: installment.grossAmountCents,
        acquirerFeeCents: installment.feeAmountCents,
        cardContractId: settlement.cardContractId,
        cardPaymentMethodId: settlement.cardPaymentMethodId,
        chartOfAccount,
        costCenter,
      });
    }
  }

  /**
   * Grava 1 `FinancialEntry` `receivable` + rateio de sistema (quando
   * disponível) + `BankTransaction` de crédito (só quando o recebível já
   * nasce quitado — `paidCents > 0`; um recebível pendente do motor ainda não
   * é dinheiro em conta, RN-13/SC-006 de `002-bank-account-ledger` continua
   * valendo só para o que já foi efetivamente recebido).
   */
  private async createFinancialEntry(
    tx: ScopedTransactionClient,
    params: {
      saleOrder: SaleOrder;
      amountCents: number;
      paidCents: number;
      status: 'pending' | 'paid';
      competenceDate: Date;
      dueDate: Date;
      bankAccountId: string | null;
      saleOrderPaymentId: string | null;
      installmentSequence: number | null;
      installmentCount: number | null;
      cardSettlementFallback: boolean;
      grossAmountCents: number | null;
      acquirerFeeCents: number | null;
      cardContractId: string | null;
      cardPaymentMethodId: string | null;
      chartOfAccount: { id: string } | null;
      costCenter: { id: string } | null;
    },
  ): Promise<void> {
    const { saleOrder } = params;

    const entry = await tx.financialEntry.create({
      data: {
        organizationId: saleOrder.organizationId,
        operation: 'receivable',
        description: `Pedido de venda #${saleOrder.number}`,
        amountCents: params.amountCents,
        paidCents: params.paidCents,
        status: params.status,
        competenceDate: params.competenceDate,
        dueDate: params.dueDate,
        partyName: saleOrder.customerName,
        customerId: saleOrder.customerId,
        bankAccountId: params.bankAccountId,
        saleOrderId: saleOrder.id,
        categoryName: 'Venda',
        saleOrderPaymentId: params.saleOrderPaymentId,
        installmentSequence: params.installmentSequence,
        installmentCount: params.installmentCount,
        cardSettlementFallback: params.cardSettlementFallback,
        grossAmountCents: params.grossAmountCents,
        acquirerFeeCents: params.acquirerFeeCents,
        cardContractId: params.cardContractId,
        cardPaymentMethodId: params.cardPaymentMethodId,
      },
    });

    if (params.chartOfAccount && params.costCenter) {
      await tx.financialEntryAllocation.create({
        data: {
          organizationId: saleOrder.organizationId,
          financialEntryId: entry.id,
          chartOfAccountId: params.chartOfAccount.id,
          costCenterId: params.costCenter.id,
          amountCents: params.amountCents,
          percentage: 100,
        },
      });
    }

    // RN-13/SC-006 (specs/erp/002-bank-account-ledger): um recebível
    // auto-gerado não passa por `payments[]` (grava `paidCents` direto
    // acima), então a movimentação de ledger correspondente precisa ser
    // criada aqui — sem isso o extrato da conta nunca saberia da venda.
    if (entry.bankAccountId && params.paidCents > 0) {
      await tx.bankTransaction.create({
        data: {
          organizationId: saleOrder.organizationId,
          bankAccountId: entry.bankAccountId,
          kind: 'credit',
          description: `Pedido de venda #${saleOrder.number}`,
          amountCents: params.paidCents,
          effectiveAt: params.competenceDate,
          sourceType: 'financial_entry_payment',
          sourceId: entry.id,
        },
      });
    }
  }

  private buildOrderBy(
    sort?: SaleOrderSortOption,
  ): Prisma.SaleOrderOrderByWithRelationInput {
    switch (sort) {
      case 'created_at_asc':
        return { createdAt: 'asc' };
      case 'amount_asc':
        return { totalCents: 'asc' };
      case 'amount_desc':
        return { totalCents: 'desc' };
      case 'number_asc':
        return { number: 'asc' };
      case 'number_desc':
        return { number: 'desc' };
      default:
        return { createdAt: 'desc' };
    }
  }

  private buildWhere(
    organizationId: string,
    criteria: Omit<SaleOrderListCriteria, 'skip' | 'take'>,
  ): Prisma.SaleOrderWhereInput {
    const and: Prisma.SaleOrderWhereInput[] = [];
    const search = criteria.search?.trim();

    and.push(
      criteria.tab === 'deleted'
        ? { deletedAt: { not: null } }
        : { deletedAt: null },
    );

    if (criteria.statuses?.length) {
      and.push({ status: { in: criteria.statuses } });
    }
    if (criteria.channelId) {
      and.push({ channelId: criteria.channelId });
    }
    if (criteria.amountMinCents !== undefined) {
      and.push({ totalCents: { gte: criteria.amountMinCents } });
    }
    if (criteria.amountMaxCents !== undefined) {
      and.push({ totalCents: { lte: criteria.amountMaxCents } });
    }
    if (criteria.dateFrom || criteria.dateTo) {
      and.push({
        createdAt: {
          ...(criteria.dateFrom ? { gte: criteria.dateFrom } : {}),
          ...(criteria.dateTo ? { lte: criteria.dateTo } : {}),
        },
      });
    }
    if (search) {
      and.push({
        OR: [
          { customerName: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
          ...(Number.isNaN(Number(search)) ? [] : [{ number: Number(search) }]),
        ],
      });
    }

    return { organizationId, AND: and };
  }

  private toEntity(row: SaleOrderRow): SaleOrder {
    return SaleOrder.with(
      {
        organizationId: row.organizationId,
        number: row.number,
        customerId: row.customerId,
        customerName: row.customerName,
        consumerDocument: row.consumerDocument,
        stockId: row.stockId,
        status: row.status as SaleOrder['status'],
        channelId: row.channelId as SaleOrder['channelId'],
        sellerId: row.sellerId,
        sellerName: row.sellerName,
        createdByName: row.createdByName,
        notes: row.notes,
        deliveryFeeCents: row.deliveryFeeCents,
        discountsCents: row.discountsCents,
        stockMovementId: row.stockMovementId,
        deletedAt: row.deletedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        lines: row.lines.map((line) => ({
          productId: line.productId,
          description: line.description,
          quantity: line.quantity.toString(),
          unitPriceCents: line.unitPriceCents,
        })),
        payments: row.payments.map((payment) => ({
          id: payment.id,
          amountCents: payment.amountCents,
          methodId: payment.methodId,
          bankAccountId: payment.bankAccountId,
          cardPaymentType: payment.cardPaymentType ?? undefined,
          brand: payment.brand,
          installments: payment.installments ?? undefined,
        })),
      },
      row.id,
    );
  }
}

import type { FinancialEntry } from '../../../../domain/entities/financial-entry.entity';
import type { ListFinancialEntriesResult } from '../../../../application/dtos/financial-entry.dto';

export class FinancialEntryPresenter {
  static toHttp(entry: FinancialEntry) {
    return {
      id: entry.id,
      operation: entry.operation,
      description: entry.description,
      amountCents: entry.amountCents,
      feesCents: entry.feesCents,
      finesCents: entry.finesCents,
      totalCents: entry.totalCents,
      paidCents: entry.paidCents,
      status: entry.status,
      competenceDate: entry.competenceDate.toISOString(),
      dueDate: entry.dueDate.toISOString(),
      partyName: entry.partyName,
      customerId: entry.customerId,
      supplierId: entry.supplierId,
      bankAccountId: entry.bankAccountId,
      saleOrderId: entry.saleOrderId,
      categoryName: entry.categoryName,
      note: entry.note,
      /** O front usa isto para travar o formulário sem reimplementar a regra (FR-016). */
      readOnly: entry.isReadOnly,
      // Motor de recebíveis do contrato de cartões (specs/erp/005-card-receivables-engine/).
      grossAmountCents: entry.grossAmountCents,
      acquirerFeeCents: entry.acquirerFeeCents,
      cardContractId: entry.cardContractId,
      cardPaymentMethodId: entry.cardPaymentMethodId,
      saleOrderPaymentId: entry.saleOrderPaymentId,
      installmentSequence: entry.installmentSequence,
      installmentCount: entry.installmentCount,
      cardSettlementFallback: entry.cardSettlementFallback,
      payments: entry.payments.map((payment) => ({
        id: payment.id,
        amountCents: payment.amountCents,
        paidAt: payment.paidAt.toISOString(),
        paymentMethod: payment.paymentMethod,
        cardBrand: payment.cardBrand,
      })),
      allocations: entry.allocations.map((allocation) => ({
        id: allocation.id,
        chartOfAccountId: allocation.chartOfAccountId,
        costCenterId: allocation.costCenterId,
        amountCents: allocation.amountCents,
        percentage: allocation.percentage,
      })),
      // `objectKey` nunca sai daqui — é a chave interna do MinIO.
      attachments: entry.attachments.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        contentType: attachment.contentType,
        sizeBytes: attachment.sizeBytes,
        createdAt: attachment.createdAt.toISOString(),
      })),
      deletedAt: entry.deletedAt?.toISOString() ?? null,
      createdAt: entry.createdAt.toISOString(),
    };
  }

  static toHttpSingle(entry: FinancialEntry) {
    return { data: this.toHttp(entry) };
  }

  /**
   * Item da listagem — mais enxuto que o detalhe. `categoryLabel` é resolvido
   * pelo caller (a entidade não conhece nome de conta do plano/centro de
   * custo, só ids) e injetado por lançamento antes de montar a resposta.
   */
  static toHttpListItem(entry: FinancialEntry, categoryLabel: string | null) {
    return {
      id: entry.id,
      operation: entry.operation,
      description: entry.description,
      amountCents: entry.amountCents,
      feesCents: entry.feesCents,
      finesCents: entry.finesCents,
      totalCents: entry.totalCents,
      paidCents: entry.paidCents,
      status: entry.status,
      competenceDate: entry.competenceDate.toISOString(),
      dueDate: entry.dueDate.toISOString(),
      partyName: entry.partyName,
      categoryLabel,
      // Motor de recebíveis (specs/erp/005-card-receivables-engine/) — sem os
      // ids de FK aqui (cardContractId/cardPaymentMethodId/
      // saleOrderPaymentId): a listagem não precisa deles, e evita inchar o
      // payload sem necessidade (contracts/financial-entry-card-settlement.contract.md).
      grossAmountCents: entry.grossAmountCents,
      acquirerFeeCents: entry.acquirerFeeCents,
      installmentSequence: entry.installmentSequence,
      installmentCount: entry.installmentCount,
      cardSettlementFallback: entry.cardSettlementFallback,
      deletedAt: entry.deletedAt?.toISOString() ?? null,
      createdAt: entry.createdAt.toISOString(),
    };
  }

  static toHttpList(
    result: ListFinancialEntriesResult,
    categoryLabels: Map<string, string>,
  ) {
    return {
      data: result.items.map((entry) =>
        this.toHttpListItem(
          entry,
          this.resolveCategoryLabel(entry, categoryLabels),
        ),
      ),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
      tabCounts: result.tabCounts,
    };
  }

  /**
   * RN-02: a listagem mostra a categoria financeira de cada lançamento. Um
   * lançamento pode ter N linhas de rateio — mostra a primeira, ou avisa que
   * há mais de uma, em vez de forçar o front a buscar as linhas de cada item
   * só para popular uma coluna.
   */
  private static resolveCategoryLabel(
    entry: FinancialEntry,
    categoryLabels: Map<string, string>,
  ): string | null {
    if (entry.allocations.length === 0) return null;
    if (entry.allocations.length > 1) return 'Múltiplas categorias';

    const [allocation] = entry.allocations;
    return categoryLabels.get(allocation.chartOfAccountId) ?? null;
  }
}

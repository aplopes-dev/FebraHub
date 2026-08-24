import type {
  CardContractListItem,
  ListCardContractsResult,
} from '../../../../application/dtos/card-contract.dto';

export class CardContractPresenter {
  static toHttp(item: CardContractListItem) {
    const { contract } = item;
    return {
      id: contract.id,
      provider: contract.provider,
      bankAccountId: contract.bankAccountId,
      description: contract.description,
      grouping: contract.grouping,
      cutoffPeriod: contract.cutoffPeriod,
      firstPaymentDayType: contract.firstPaymentDayType,
      installmentDayType: contract.installmentDayType,
      businessDaysOnly: contract.businessDaysOnly,
      depositFeeCents: contract.depositFeeCents,
      anticipationPeriods: contract.anticipationPeriods,
      anticipationRate: contract.anticipationRate,
      allEntriesPaidInContract: contract.allEntriesPaidInContract,
      businessDaysDeposit: contract.businessDaysDeposit,
      active: contract.active,
      paymentMethodCount: item.paymentMethodCount,
      deletedAt: contract.deletedAt?.toISOString() ?? null,
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(item: CardContractListItem) {
    return { data: this.toHttp(item) };
  }

  static toHttpList(result: ListCardContractsResult) {
    return {
      data: result.items.map((item) => this.toHttp(item)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
      tabCounts: result.tabCounts,
    };
  }
}

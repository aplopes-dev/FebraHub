import type {
  ChartOfAccountListItem,
  ListChartOfAccountsResult,
} from '../../../../application/dtos/chart-of-account.dto';

export class ChartOfAccountPresenter {
  static toHttp(item: ChartOfAccountListItem) {
    return {
      id: item.account.id,
      name: item.account.name,
      financialGroupId: item.account.financialGroupId,
      financialGroupName: item.financialGroupName,
      financialGroupType: item.financialGroupType,
      availableForPdv: item.account.availableForPdv,
      isSystem: item.account.isSystem,
      deletedAt: item.account.deletedAt?.toISOString() ?? null,
      createdAt: item.account.createdAt.toISOString(),
      updatedAt: item.account.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(item: ChartOfAccountListItem) {
    return { data: this.toHttp(item) };
  }

  static toHttpList(result: ListChartOfAccountsResult) {
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

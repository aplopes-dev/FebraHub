import type { FinancialGroup } from '../../../../domain/entities/financial-group.entity';
import type { ListFinancialGroupsResult } from '../../../../application/dtos/financial-group.dto';

export class FinancialGroupPresenter {
  static toHttp(group: FinancialGroup) {
    return {
      id: group.id,
      name: group.name,
      type: group.type,
      isSystem: group.isSystem,
      deletedAt: group.deletedAt?.toISOString() ?? null,
      createdAt: group.createdAt.toISOString(),
      updatedAt: group.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(group: FinancialGroup) {
    return { data: this.toHttp(group) };
  }

  static toHttpList(result: ListFinancialGroupsResult) {
    return {
      data: result.items.map((group) => this.toHttp(group)),
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

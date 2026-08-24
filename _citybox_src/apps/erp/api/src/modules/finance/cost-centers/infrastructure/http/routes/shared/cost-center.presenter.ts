import type { CostCenter } from '../../../../domain/entities/cost-center.entity';
import type { ListCostCentersResult } from '../../../../application/dtos/cost-center.dto';

export class CostCenterPresenter {
  static toHttp(costCenter: CostCenter) {
    return {
      id: costCenter.id,
      name: costCenter.name,
      isSystem: costCenter.isSystem,
      deletedAt: costCenter.deletedAt?.toISOString() ?? null,
      createdAt: costCenter.createdAt.toISOString(),
      updatedAt: costCenter.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(costCenter: CostCenter) {
    return { data: this.toHttp(costCenter) };
  }

  static toHttpList(result: ListCostCentersResult) {
    return {
      data: result.items.map((costCenter) => this.toHttp(costCenter)),
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

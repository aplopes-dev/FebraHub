import type {
  ListTechnicalSheetsResult,
  UpsertTechnicalSheetResult,
} from '../../../../application/dtos/technical-sheet.dto';
import type { TechnicalSheetDetailView } from '../../../../domain/repositories/technical-sheet.repository.interface';
import { toProductImageFlags } from './product-image-flags';

export class TechnicalSheetPresenter {
  static toHttpListItem(row: ListTechnicalSheetsResult['items'][number]) {
    return {
      id: row.productId,
      name: row.name,
      sku: row.sku,
      ...toProductImageFlags(row.imageUrl),
      category: row.categoryName,
      productionType: row.productionType,
      hasComposition: row.hasComposition,
    };
  }

  static toHttpPaginatedList(result: ListTechnicalSheetsResult) {
    return {
      data: result.items.map((item) => this.toHttpListItem(item)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
      tabCounts: result.tabCounts,
    };
  }

  static toHttpDetail(detail: TechnicalSheetDetailView) {
    return {
      data: {
        productId: detail.productId,
        name: detail.name,
        sku: detail.sku,
        ...toProductImageFlags(detail.imageUrl),
        category: detail.categoryName,
        productionType: detail.productionType,
        maxRemovableComponents: detail.maxRemovableComponents,
        markupPercent: detail.markupPercent,
        currentPriceCents: detail.currentPriceCents,
        totalCostCents: detail.totalCostCents,
        hasSheet: detail.hasSheet,
        components: detail.components,
        optionComponents: detail.optionComponents,
      },
    };
  }

  static toHttpUpsert(result: UpsertTechnicalSheetResult) {
    return this.toHttpDetail(result.detail);
  }
}

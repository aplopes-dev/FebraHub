import type { Stock } from '../../../../domain/entities/stock.entity';
import type { ListStocksResult } from '../../../../application/dtos/stock.dto';

export class StockPresenter {
  static toHttp(stock: Stock, hasMovements = false) {
    return {
      id: stock.id,
      name: stock.name,
      location: stock.location,
      property: stock.property,
      branchIds: stock.branchIds,
      isDefault: stock.isDefault,
      isSystem: stock.isSystem,
      hasMovements,
      createdAt: stock.createdAt.toISOString(),
      updatedAt: stock.updatedAt.toISOString(),
    };
  }

  static toHttpSingle(stock: Stock, hasMovements = false) {
    return { data: this.toHttp(stock, hasMovements) };
  }

  static toHttpList(result: ListStocksResult) {
    return {
      data: result.items.map((stock) =>
        this.toHttp(stock, result.stockIdsWithMovements.has(stock.id)),
      ),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.perPage,
        totalPages: result.totalPages,
      },
    };
  }
}

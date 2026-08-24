import type { FiscalParametersDetail } from '../../../../application/dtos/product-fiscal.dto';
import type { ListFiscalParametersResult } from '../../../../application/dtos/product-fiscal.dto';
import type { ProductFiscal } from '../../../../domain/entities/product-fiscal.entity';
import { toProductImageFlags } from './product-image-flags';

export class ProductFiscalPresenter {
  static toHttpListItem(row: ListFiscalParametersResult['items'][number]) {
    return {
      id: row.productId,
      name: row.name,
      sku: row.sku,
      ...toProductImageFlags(row.imageUrl),
      category: row.categoryName,
      configured: row.configured,
    };
  }

  static toHttpPaginatedList(result: ListFiscalParametersResult) {
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

  static toHttpDetail(detail: FiscalParametersDetail) {
    return {
      data: {
        id: detail.productId,
        name: detail.name,
        sku: detail.sku,
        ...toProductImageFlags(detail.imageUrl),
        category: detail.categoryName,
        configured: detail.configured,
        info: {
          ncm: detail.info.ncm,
          origin: detail.info.origin,
          netWeightKg: detail.info.netWeightKg,
          grossWeightKg: detail.info.grossWeightKg,
          cest: detail.info.cest,
          fcpPercent: detail.info.fcpPercent,
          fcpStPercent: detail.info.fcpStPercent,
          fcpStRetainedPercent: detail.info.fcpStRetainedPercent,
          cstIbsCbs: detail.info.cstIbsCbs,
          taxClassification: detail.info.taxClassification,
        },
        group: detail.group,
        pisCofinsGroupId: detail.pisCofinsGroupId,
        icmsGroupId: detail.icmsGroupId,
        issqnGroupId: detail.issqnGroupId,
        ipiGroupId: detail.ipiGroupId,
        units: detail.units.map((unit) => ({
          branchId: unit.branchId,
          icms: unit.icms,
          pisCofins: unit.pisCofins,
          ipi: unit.ipi,
          cfop: unit.cfop,
          issqn: unit.issqn,
        })),
      },
    };
  }

  static toHttpUpsert(fiscal: ProductFiscal) {
    return {
      data: {
        productId: fiscal.productId,
        configured: fiscal.configured,
        info: {
          ncm: fiscal.ncm,
          origin: fiscal.origin,
          netWeightKg: fiscal.netWeightKg,
          grossWeightKg: fiscal.grossWeightKg,
          cest: fiscal.cest,
          fcpPercent: fiscal.fcpPercent,
          fcpStPercent: fiscal.fcpStPercent,
          fcpStRetainedPercent: fiscal.fcpStRetainedPercent,
          cstIbsCbs: fiscal.cstIbsCbs,
          taxClassification: fiscal.taxClassification,
        },
        group: {
          icms: fiscal.icms,
          pisCofins: fiscal.pisCofins,
          ipi: fiscal.ipi,
          cfop: fiscal.cfop,
          issqn: fiscal.issqn,
        },
        pisCofinsGroupId: fiscal.pisCofinsGroupId,
        icmsGroupId: fiscal.icmsGroupId,
        issqnGroupId: fiscal.issqnGroupId,
        ipiGroupId: fiscal.ipiGroupId,
        units: fiscal.branches,
      },
    };
  }
}

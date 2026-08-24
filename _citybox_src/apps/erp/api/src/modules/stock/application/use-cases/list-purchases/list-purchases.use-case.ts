import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../tenancy/application/pagination';
import { PurchaseRepository } from '../../../domain/repositories/purchase.repository.interface';
import type {
  ListPurchasesDto,
  ListPurchasesResult,
} from '../../dtos/purchase.dto';

@Injectable()
export class ListPurchasesUseCase implements IUseCase<
  ListPurchasesDto,
  ListPurchasesResult
> {
  constructor(private readonly purchaseRepository: PurchaseRepository) {}

  async execute(input: ListPurchasesDto): Promise<ListPurchasesResult> {
    const criteria = {
      tab: input.tab,
      status: input.status,
      search: input.search,
      stockId: input.stockId,
      supplierId: input.supplierId,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
    };

    // Os contadores das abas ignoram os demais filtros de propósito —
    // dizem quanto existe em cada aba, não quanto a busca/filtro achou.
    const [total, tabCounts] = await Promise.all([
      this.purchaseRepository.count(input.organizationId, criteria),
      this.purchaseRepository.countByTabs(input.organizationId),
    ]);

    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.purchaseRepository.findAll(input.organizationId, {
      ...criteria,
      skip: pagination.skip,
      take: pagination.perPage,
    });

    return {
      items,
      total,
      page: pagination.page,
      perPage: pagination.perPage,
      totalPages: pagination.totalPages,
      tabCounts,
    };
  }
}

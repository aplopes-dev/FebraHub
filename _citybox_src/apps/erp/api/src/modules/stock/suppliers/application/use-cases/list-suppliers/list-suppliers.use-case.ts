import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../../tenancy/application/pagination';
import { SupplierRepository } from '../../../domain/repositories/supplier.repository.interface';
import type {
  ListSuppliersDto,
  ListSuppliersResult,
} from '../../dtos/supplier.dto';

@Injectable()
export class ListSuppliersUseCase implements IUseCase<
  ListSuppliersDto,
  ListSuppliersResult
> {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async execute(input: ListSuppliersDto): Promise<ListSuppliersResult> {
    const tab = input.tab ?? 'active';
    const criteria = { search: input.search, tab };

    // Os contadores das abas ignoram a busca de propósito (paridade com o
    // front): eles dizem quanto existe em cada aba, não quanto a busca achou.
    const [total, active, deleted] = await Promise.all([
      this.supplierRepository.count(input.organizationId, criteria),
      this.supplierRepository.count(input.organizationId, { tab: 'active' }),
      this.supplierRepository.count(input.organizationId, { tab: 'deleted' }),
    ]);

    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.supplierRepository.findAll(input.organizationId, {
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
      tabCounts: { active, deleted },
    };
  }
}

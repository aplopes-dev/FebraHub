import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../../tenancy/application/pagination';
import { CarrierRepository } from '../../../domain/repositories/carrier.repository.interface';
import type {
  ListCarriersDto,
  ListCarriersResult,
} from '../../dtos/carrier.dto';

@Injectable()
export class ListCarriersUseCase implements IUseCase<
  ListCarriersDto,
  ListCarriersResult
> {
  constructor(private readonly carrierRepository: CarrierRepository) {}

  async execute(input: ListCarriersDto): Promise<ListCarriersResult> {
    const tab = input.tab ?? 'active';
    const criteria = { search: input.search, tab };

    // Os contadores das abas ignoram a busca de propósito (paridade com o
    // front): eles dizem quanto existe em cada aba, não quanto a busca achou.
    const [total, active, deleted] = await Promise.all([
      this.carrierRepository.count(input.organizationId, criteria),
      this.carrierRepository.count(input.organizationId, { tab: 'active' }),
      this.carrierRepository.count(input.organizationId, { tab: 'deleted' }),
    ]);

    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.carrierRepository.findAll(input.organizationId, {
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

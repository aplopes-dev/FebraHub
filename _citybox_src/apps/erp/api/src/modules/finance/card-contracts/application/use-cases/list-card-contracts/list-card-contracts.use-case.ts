import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../../tenancy/application/pagination';
import { CardContractRepository } from '../../../domain/repositories/card-contract.repository.interface';
import type {
  ListCardContractsDto,
  ListCardContractsResult,
} from '../../dtos/card-contract.dto';

@Injectable()
export class ListCardContractsUseCase implements IUseCase<
  ListCardContractsDto,
  ListCardContractsResult
> {
  constructor(
    private readonly cardContractRepository: CardContractRepository,
  ) {}

  async execute(input: ListCardContractsDto): Promise<ListCardContractsResult> {
    const tab = input.tab ?? 'active';
    const criteria = { search: input.search, tab };

    // Os contadores das abas ignoram a busca de propósito (paridade com o
    // front): eles dizem quanto existe em cada aba, não quanto a busca achou.
    const [total, tabCounts] = await Promise.all([
      this.cardContractRepository.count(input.organizationId, criteria),
      this.cardContractRepository.countByTabs(input.organizationId),
    ]);

    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.cardContractRepository.findAll(
      input.organizationId,
      {
        ...criteria,
        skip: pagination.skip,
        take: pagination.perPage,
      },
    );

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

import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { BranchRepository } from '../../../domain/repositories/branch.repository.interface';
import { resolvePagination } from '../../pagination';
import type {
  ListBranchesDto,
  ListBranchesResult,
} from '../../dtos/branch.dto';

@Injectable()
export class ListBranchesUseCase implements IUseCase<
  ListBranchesDto,
  ListBranchesResult
> {
  constructor(private readonly branchRepository: BranchRepository) {}

  async execute(input: ListBranchesDto): Promise<ListBranchesResult> {
    const criteria = {
      search: input.search,
      activeOnly: input.activeOnly,
      includeDeleted: input.includeDeleted,
      allowedBranchIds: input.allowedBranchIds ?? null,
    };

    const total = await this.branchRepository.count(
      input.organizationId,
      criteria,
    );
    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.branchRepository.findAll(input.organizationId, {
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
    };
  }
}

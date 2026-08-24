import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { resolvePagination } from '../../../../tenancy/application/pagination';
import { MovementCategoryRepository } from '../../../domain/repositories/movement-category.repository.interface';
import type {
  ListMovementCategoriesDto,
  ListMovementCategoriesResult,
} from '../../dtos/movement-category.dto';

@Injectable()
export class ListMovementCategoriesUseCase implements IUseCase<
  ListMovementCategoriesDto,
  ListMovementCategoriesResult
> {
  constructor(
    private readonly movementCategoryRepository: MovementCategoryRepository,
  ) {}

  async execute(
    input: ListMovementCategoriesDto,
  ): Promise<ListMovementCategoriesResult> {
    const criteria = { search: input.search, type: input.type };

    const total = await this.movementCategoryRepository.count(
      input.organizationId,
      criteria,
    );

    const pagination = resolvePagination(total, input.page, input.perPage);

    const items = await this.movementCategoryRepository.findAll(
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
    };
  }
}

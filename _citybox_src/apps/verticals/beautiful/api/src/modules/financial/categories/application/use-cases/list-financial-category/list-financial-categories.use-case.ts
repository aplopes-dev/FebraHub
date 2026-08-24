import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialCategoryRepository } from '../../../domain/repositories/financial-category.repository.interface';
import type {
  ListFinancialCategoriesDto,
  ListFinancialCategoriesResult,
} from '../../dtos/financial-category.dto';

@Injectable()
export class ListFinancialCategoriesUseCase implements IUseCase<
  ListFinancialCategoriesDto,
  ListFinancialCategoriesResult
> {
  constructor(
    private readonly categoryRepository: FinancialCategoryRepository,
  ) {}

  async execute(
    dto: ListFinancialCategoriesDto,
  ): Promise<ListFinancialCategoriesResult> {
    const items = await this.categoryRepository.findMany(dto.storeId, {
      kind: dto.kind,
    });
    return { items };
  }
}

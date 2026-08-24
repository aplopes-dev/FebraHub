import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialCategoryRepository } from '../../../domain/repositories/financial-category.repository.interface';
import { FinancialCategoryNotFoundError } from '../../../domain/errors/financial-category-not-found.error';
import type { DeleteFinancialCategoryDto } from '../../dtos/financial-category.dto';

@Injectable()
export class DeleteFinancialCategoryUseCase
  implements IUseCase<DeleteFinancialCategoryDto, void>
{
  constructor(
    private readonly categoryRepository: FinancialCategoryRepository,
  ) {}

  async execute(dto: DeleteFinancialCategoryDto): Promise<void> {
    const existing = await this.categoryRepository.findById(
      dto.storeId,
      dto.categoryId,
    );
    if (!existing) {
      throw new FinancialCategoryNotFoundError(
        DeleteFinancialCategoryUseCase.name,
        dto.categoryId,
      );
    }
    await this.categoryRepository.delete(dto.storeId, dto.categoryId);
  }
}

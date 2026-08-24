import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialCategory } from '../../../domain/entities/financial-category.entity';
import { FinancialCategoryRepository } from '../../../domain/repositories/financial-category.repository.interface';
import { FinancialCategoryNotFoundError } from '../../../domain/errors/financial-category-not-found.error';
import type { UpdateFinancialCategoryDto } from '../../dtos/financial-category.dto';

@Injectable()
export class UpdateFinancialCategoryUseCase implements IUseCase<
  UpdateFinancialCategoryDto,
  FinancialCategory
> {
  constructor(
    private readonly categoryRepository: FinancialCategoryRepository,
  ) {}

  async execute(dto: UpdateFinancialCategoryDto): Promise<FinancialCategory> {
    const existing = await this.categoryRepository.findById(
      dto.storeId,
      dto.categoryId,
    );
    if (!existing) {
      throw new FinancialCategoryNotFoundError(
        UpdateFinancialCategoryUseCase.name,
        dto.categoryId,
      );
    }

    const updated = existing.withUpdate({
      name: dto.name !== undefined ? dto.name.trim() : undefined,
      color: dto.color !== undefined ? dto.color.trim() : undefined,
    });

    return this.categoryRepository.save(updated);
  }
}

import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialCategory } from '../../../domain/entities/financial-category.entity';
import { FinancialCategoryRepository } from '../../../domain/repositories/financial-category.repository.interface';
import type { CreateFinancialCategoryDto } from '../../dtos/financial-category.dto';

@Injectable()
export class CreateFinancialCategoryUseCase implements IUseCase<
  CreateFinancialCategoryDto,
  FinancialCategory
> {
  constructor(
    private readonly categoryRepository: FinancialCategoryRepository,
  ) {}

  async execute(dto: CreateFinancialCategoryDto): Promise<FinancialCategory> {
    const category = FinancialCategory.create({
      storeId: dto.storeId,
      kind: dto.kind,
      name: dto.name.trim(),
      color: dto.color?.trim() ?? '',
    });
    return this.categoryRepository.save(category);
  }
}

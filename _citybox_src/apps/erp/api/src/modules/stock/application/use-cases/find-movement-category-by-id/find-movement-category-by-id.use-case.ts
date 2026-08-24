import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { MovementCategory } from '../../../domain/entities/movement-category.entity';
import { MovementCategoryRepository } from '../../../domain/repositories/movement-category.repository.interface';
import { MovementCategoryNotFoundError } from '../../../domain/errors/movement-category-not-found.error';
import type { FindMovementCategoryByIdDto } from '../../dtos/movement-category.dto';

@Injectable()
export class FindMovementCategoryByIdUseCase implements IUseCase<
  FindMovementCategoryByIdDto,
  MovementCategory
> {
  constructor(
    private readonly movementCategoryRepository: MovementCategoryRepository,
  ) {}

  async execute(input: FindMovementCategoryByIdDto): Promise<MovementCategory> {
    const category = await this.movementCategoryRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!category) throw new MovementCategoryNotFoundError(input.id);

    return category;
  }
}

import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { MovementCategoryRepository } from '../../../domain/repositories/movement-category.repository.interface';
import type {
  ListMovementCategoryOptionsDto,
  MovementCategoryOption,
} from '../../dtos/movement-category.dto';

/**
 * Options enxutas para selects (Fase 3 — movimentações).
 * Ordenadas por nome; filtráveis por `type`.
 */
@Injectable()
export class ListMovementCategoryOptionsUseCase implements IUseCase<
  ListMovementCategoryOptionsDto,
  MovementCategoryOption[]
> {
  constructor(
    private readonly movementCategoryRepository: MovementCategoryRepository,
  ) {}

  async execute(
    input: ListMovementCategoryOptionsDto,
  ): Promise<MovementCategoryOption[]> {
    const items = await this.movementCategoryRepository.findAll(
      input.organizationId,
      { type: input.type },
    );

    return [...items]
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      .map((category) => ({
        id: category.id,
        name: category.name,
        type: category.type,
      }));
  }
}

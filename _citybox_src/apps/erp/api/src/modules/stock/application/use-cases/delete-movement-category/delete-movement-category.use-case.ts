import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { MovementCategoryRepository } from '../../../domain/repositories/movement-category.repository.interface';
import { MovementCategoryNotFoundError } from '../../../domain/errors/movement-category-not-found.error';
import { MovementCategoryNotRemovableError } from '../../../domain/errors/movement-category-not-removable.error';
import type { DeleteMovementCategoryDto } from '../../dtos/movement-category.dto';

/**
 * Exclui categoria de usuário (hard-delete).
 *
 * Categorias de sistema nunca podem ser removidas.
 */
@Injectable()
export class DeleteMovementCategoryUseCase implements IUseCase<
  DeleteMovementCategoryDto,
  void
> {
  constructor(
    private readonly movementCategoryRepository: MovementCategoryRepository,
  ) {}

  async execute(input: DeleteMovementCategoryDto): Promise<void> {
    const category = await this.movementCategoryRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!category) throw new MovementCategoryNotFoundError(input.id);

    if (category.isSystem) {
      throw new MovementCategoryNotRemovableError(input.id, 'system');
    }

    // `StockMovement.category` é `onDelete: Restrict` — sem esta checagem o
    // delete estoura FK (P2003) e escapa como 500, apesar de a rota já
    // documentar 409. Mesmo molde de `delete-stock.use-case`.
    const inUse = await this.movementCategoryRepository.isInUse(
      input.organizationId,
      input.id,
    );
    if (inUse) {
      throw new MovementCategoryNotRemovableError(input.id, 'inUse');
    }

    await this.movementCategoryRepository.delete(
      input.organizationId,
      input.id,
    );
  }
}

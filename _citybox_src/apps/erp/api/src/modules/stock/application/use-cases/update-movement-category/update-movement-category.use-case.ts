import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { BranchRepository } from '../../../../tenancy/domain/repositories/branch.repository.interface';
import type { MovementCategory } from '../../../domain/entities/movement-category.entity';
import { MovementCategoryRepository } from '../../../domain/repositories/movement-category.repository.interface';
import { MovementCategoryNotFoundError } from '../../../domain/errors/movement-category-not-found.error';
import { MovementCategoryImmutableFieldError } from '../../../domain/errors/movement-category-immutable-field.error';
import type { UpdateMovementCategoryDto } from '../../dtos/movement-category.dto';
import { assertBranchesBelongToOrganization } from '../../../suppliers/application/use-cases/assert-branches-belong-to-organization';

/**
 * Atualiza nome, type e unidades.
 *
 * Em categorias de sistema, `type` (e code/systemKey) são imutáveis —
 * só nome e `branchIds` podem mudar.
 */
@Injectable()
export class UpdateMovementCategoryUseCase implements IUseCase<
  UpdateMovementCategoryDto,
  MovementCategory
> {
  constructor(
    private readonly movementCategoryRepository: MovementCategoryRepository,
    private readonly branchRepository: BranchRepository,
  ) {}

  async execute(input: UpdateMovementCategoryDto): Promise<MovementCategory> {
    const category = await this.movementCategoryRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!category) throw new MovementCategoryNotFoundError(input.id);

    if (category.isSystem && input.type !== category.type) {
      throw new MovementCategoryImmutableFieldError('type');
    }

    const branchIds = await assertBranchesBelongToOrganization(
      this.branchRepository,
      input.organizationId,
      input.branchIds,
    );

    const updated = category.update({
      name: input.name,
      type: category.isSystem ? category.type : input.type,
      branchIds,
    });

    return this.movementCategoryRepository.save(updated);
  }
}

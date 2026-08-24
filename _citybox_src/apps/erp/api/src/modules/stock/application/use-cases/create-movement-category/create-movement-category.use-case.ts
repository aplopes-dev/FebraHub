import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { BranchRepository } from '../../../../tenancy/domain/repositories/branch.repository.interface';
import { MovementCategory } from '../../../domain/entities/movement-category.entity';
import { MovementCategoryRepository } from '../../../domain/repositories/movement-category.repository.interface';
import type { CreateMovementCategoryDto } from '../../dtos/movement-category.dto';
import { assertBranchesBelongToOrganization } from '../../../suppliers/application/use-cases/assert-branches-belong-to-organization';
import { MovementCategoryCodeTakenError } from '../../../domain/errors/movement-category-code-taken.error';

/**
 * Quantas vezes recalcular o código antes de desistir.
 *
 * `nextCode` lê o máximo atual e o `save` grava depois — duas requisições
 * simultâneas leem o mesmo valor e a segunda viola o unique. Três tentativas
 * cobrem folgadamente a concorrência real deste cadastro (dezenas de
 * categorias por organização, criadas manualmente).
 */
const MAX_CODE_ATTEMPTS = 3;

/**
 * Cadastra uma categoria de movimentação do usuário (`isSystem=false`).
 *
 * Código `CM-NNN` é gerado automaticamente; exige ≥1 unidade válida.
 */
@Injectable()
export class CreateMovementCategoryUseCase implements IUseCase<
  CreateMovementCategoryDto,
  MovementCategory
> {
  constructor(
    private readonly movementCategoryRepository: MovementCategoryRepository,
    private readonly branchRepository: BranchRepository,
  ) {}

  async execute(input: CreateMovementCategoryDto): Promise<MovementCategory> {
    const branchIds = await assertBranchesBelongToOrganization(
      this.branchRepository,
      input.organizationId,
      input.branchIds,
    );

    for (let attempt = 1; ; attempt += 1) {
      const code = await this.movementCategoryRepository.nextCode(
        input.organizationId,
      );

      const category = MovementCategory.create({
        organizationId: input.organizationId,
        code,
        name: input.name,
        type: input.type,
        branchIds,
        isSystem: false,
        systemKey: null,
      });

      try {
        return await this.movementCategoryRepository.save(category);
      } catch (error) {
        const isRetryable = error instanceof MovementCategoryCodeTakenError;
        if (!isRetryable || attempt >= MAX_CODE_ATTEMPTS) throw error;
      }
    }
  }
}

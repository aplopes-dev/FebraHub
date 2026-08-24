import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { BranchRepository } from '../../../domain/repositories/branch.repository.interface';
import { BranchNotFoundError } from '../../../domain/errors/branch-not-found.error';
import type { DeleteBranchDto } from '../../dtos/branch.dto';

/**
 * Desativa a unidade (soft-delete).
 *
 * Nunca apaga: notas, vendas e movimentos de caixa já emitidos apontam para
 * ela, e o histórico fiscal precisa continuar resolvendo.
 */
@Injectable()
export class DeleteBranchUseCase implements IUseCase<DeleteBranchDto, void> {
  constructor(private readonly branchRepository: BranchRepository) {}

  async execute(input: DeleteBranchDto): Promise<void> {
    const branch = await this.branchRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!branch || branch.deletedAt) throw new BranchNotFoundError(input.id);

    await this.branchRepository.save(branch.softDelete());
  }
}

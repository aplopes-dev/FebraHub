import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialGroupRepository } from '../../../domain/repositories/financial-group.repository.interface';
import { FinancialGroupNotFoundError } from '../../../domain/errors/financial-group-not-found.error';
import { FinancialGroupInUseError } from '../../../domain/errors/financial-group-in-use.error';
import { FinancialGroupNotRemovableError } from '../../../domain/errors/financial-group-not-removable.error';
import type { DeleteFinancialGroupDto } from '../../dtos/financial-group.dto';

/**
 * Exclui o grupo financeiro (soft-delete).
 *
 * Só o grupo vazio sai: com contas do plano ainda apontando para ele, excluir
 * deixaria o plano de contas referenciando uma classificação que a tela não
 * mostra mais.
 */
@Injectable()
export class DeleteFinancialGroupUseCase implements IUseCase<
  DeleteFinancialGroupDto,
  void
> {
  constructor(private readonly groupRepository: FinancialGroupRepository) {}

  async execute(input: DeleteFinancialGroupDto): Promise<void> {
    const group = await this.groupRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!group || group.deletedAt) {
      throw new FinancialGroupNotFoundError(input.id);
    }

    if (group.isSystem) {
      throw new FinancialGroupNotRemovableError(input.id);
    }

    const chartOfAccountCount = await this.groupRepository.countChartOfAccounts(
      input.organizationId,
      input.id,
    );
    if (chartOfAccountCount > 0) {
      throw new FinancialGroupInUseError(group.name, chartOfAccountCount);
    }

    await this.groupRepository.save(group.softDelete());
  }
}

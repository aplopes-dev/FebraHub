import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ChartOfAccountRepository } from '../../../domain/repositories/chart-of-account.repository.interface';
import { ChartOfAccountNotFoundError } from '../../../domain/errors/chart-of-account-not-found.error';
import { ChartOfAccountNotRemovableError } from '../../../domain/errors/chart-of-account-not-removable.error';
import type { DeleteChartOfAccountDto } from '../../dtos/chart-of-account.dto';

/**
 * Exclui a conta (soft-delete).
 *
 * Não há regra de "em uso": o lançamento guarda hoje o **nome** da categoria
 * como texto, então nenhuma linha do razão fica órfã ao excluir a conta.
 */
@Injectable()
export class DeleteChartOfAccountUseCase implements IUseCase<
  DeleteChartOfAccountDto,
  void
> {
  constructor(private readonly accountRepository: ChartOfAccountRepository) {}

  async execute(input: DeleteChartOfAccountDto): Promise<void> {
    const account = await this.accountRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!account || account.deletedAt) {
      throw new ChartOfAccountNotFoundError(input.id);
    }

    if (account.isSystem) {
      throw new ChartOfAccountNotRemovableError(input.id);
    }

    await this.accountRepository.save(account.softDelete());
  }
}

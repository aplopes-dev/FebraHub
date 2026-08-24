import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ChartOfAccountRepository } from '../../../domain/repositories/chart-of-account.repository.interface';
import { ChartOfAccountNotFoundError } from '../../../domain/errors/chart-of-account-not-found.error';
import type {
  ChartOfAccountListItem,
  FindChartOfAccountByIdDto,
} from '../../dtos/chart-of-account.dto';

@Injectable()
export class FindChartOfAccountByIdUseCase implements IUseCase<
  FindChartOfAccountByIdDto,
  ChartOfAccountListItem
> {
  constructor(private readonly accountRepository: ChartOfAccountRepository) {}

  async execute(
    input: FindChartOfAccountByIdDto,
  ): Promise<ChartOfAccountListItem> {
    // Devolve também a excluída: a aba "Excluídas" da listagem leva até ela, e
    // a tela precisa mostrar o cadastro antes de restaurar.
    const item = await this.accountRepository.findByIdWithGroup(
      input.organizationId,
      input.id,
    );
    if (!item) throw new ChartOfAccountNotFoundError(input.id);

    return item;
  }
}

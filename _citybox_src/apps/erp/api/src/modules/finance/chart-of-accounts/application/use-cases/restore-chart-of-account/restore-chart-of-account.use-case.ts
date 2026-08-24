import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ChartOfAccountRepository } from '../../../domain/repositories/chart-of-account.repository.interface';
import { ChartOfAccountNotFoundError } from '../../../domain/errors/chart-of-account-not-found.error';
import type {
  ChartOfAccountListItem,
  RestoreChartOfAccountDto,
} from '../../dtos/chart-of-account.dto';

@Injectable()
export class RestoreChartOfAccountUseCase implements IUseCase<
  RestoreChartOfAccountDto,
  ChartOfAccountListItem
> {
  constructor(private readonly accountRepository: ChartOfAccountRepository) {}

  async execute(
    input: RestoreChartOfAccountDto,
  ): Promise<ChartOfAccountListItem> {
    const item = await this.accountRepository.findByIdWithGroup(
      input.organizationId,
      input.id,
    );
    if (!item) throw new ChartOfAccountNotFoundError(input.id);

    // Restaurar quem já está ativa não é erro: o botão pode ter sido clicado
    // duas vezes, e o resultado desejado — conta ativa — é o mesmo.
    if (!item.account.deletedAt) return item;

    const account = await this.accountRepository.save(item.account.restore());
    return { ...item, account };
  }
}

import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialAccountRepository } from '../../../domain/repositories/financial-account.repository.interface';
import type {
  ListFinancialAccountsDto,
  ListFinancialAccountsResult,
} from '../../dtos/financial-account.dto';

@Injectable()
export class ListFinancialAccountsUseCase implements IUseCase<
  ListFinancialAccountsDto,
  ListFinancialAccountsResult
> {
  constructor(private readonly accountRepository: FinancialAccountRepository) {}

  async execute(
    dto: ListFinancialAccountsDto,
  ): Promise<ListFinancialAccountsResult> {
    const items = await this.accountRepository.findMany(dto.storeId, {
      includeInactive: dto.includeInactive ?? false,
    });
    return { items };
  }
}

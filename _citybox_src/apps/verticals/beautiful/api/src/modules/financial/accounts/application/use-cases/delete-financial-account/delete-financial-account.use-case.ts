import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialAccountRepository } from '../../../domain/repositories/financial-account.repository.interface';
import { FinancialAccountNotFoundError } from '../../../domain/errors/financial-account-not-found.error';
import type { DeleteFinancialAccountDto } from '../../dtos/financial-account.dto';

@Injectable()
export class DeleteFinancialAccountUseCase implements IUseCase<
  DeleteFinancialAccountDto,
  void
> {
  constructor(private readonly accountRepository: FinancialAccountRepository) {}

  async execute(dto: DeleteFinancialAccountDto): Promise<void> {
    const existing = await this.accountRepository.findById(
      dto.storeId,
      dto.accountId,
    );
    if (!existing) {
      throw new FinancialAccountNotFoundError(
        DeleteFinancialAccountUseCase.name,
        dto.accountId,
      );
    }
    await this.accountRepository.delete(dto.storeId, dto.accountId);
  }
}

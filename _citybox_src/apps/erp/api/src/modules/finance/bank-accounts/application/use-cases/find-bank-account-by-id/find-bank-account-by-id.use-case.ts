import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { BankAccountRepository } from '../../../domain/repositories/bank-account.repository.interface';
import { BankTransactionRepository } from '../../../domain/repositories/bank-transaction.repository.interface';
import { BankAccountNotFoundError } from '../../../domain/errors/bank-account-not-found.error';
import type {
  BankAccountWithBalance,
  FindBankAccountByIdDto,
} from '../../dtos/bank-account.dto';

@Injectable()
export class FindBankAccountByIdUseCase implements IUseCase<
  FindBankAccountByIdDto,
  BankAccountWithBalance
> {
  constructor(
    private readonly bankAccountRepository: BankAccountRepository,
    private readonly bankTransactionRepository: BankTransactionRepository,
  ) {}

  async execute(
    input: FindBankAccountByIdDto,
  ): Promise<BankAccountWithBalance> {
    const account = await this.bankAccountRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!account) throw new BankAccountNotFoundError(input.id);

    const balances =
      await this.bankTransactionRepository.sumBalancesByAccountIds(
        input.organizationId,
        [account.id],
      );

    return { account, currentBalanceCents: balances[account.id] ?? 0 };
  }
}

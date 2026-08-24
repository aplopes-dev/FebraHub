import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { BankAccount } from '../../../domain/entities/bank-account.entity';
import { BankAccountRepository } from '../../../domain/repositories/bank-account.repository.interface';
import { BankAccountNotFoundError } from '../../../domain/errors/bank-account-not-found.error';
import type { RestoreBankAccountDto } from '../../dtos/bank-account.dto';

@Injectable()
export class RestoreBankAccountUseCase implements IUseCase<
  RestoreBankAccountDto,
  BankAccount
> {
  constructor(private readonly bankAccountRepository: BankAccountRepository) {}

  async execute(input: RestoreBankAccountDto): Promise<BankAccount> {
    const bankAccount = await this.bankAccountRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!bankAccount) throw new BankAccountNotFoundError(input.id);

    // Restaurar quem já está ativa não é erro: o botão pode ter sido clicado
    // duas vezes, e o resultado desejado — conta ativa — é o mesmo.
    if (!bankAccount.deletedAt) return bankAccount;

    const restored = bankAccount.restore();
    await this.bankAccountRepository.clearDeletedAt(
      input.organizationId,
      input.id,
      restored.updatedAt,
    );
    return restored;
  }
}

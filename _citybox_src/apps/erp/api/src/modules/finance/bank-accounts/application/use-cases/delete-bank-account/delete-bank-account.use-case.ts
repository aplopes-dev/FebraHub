import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { BankAccountRepository } from '../../../domain/repositories/bank-account.repository.interface';
import { BankAccountNotFoundError } from '../../../domain/errors/bank-account-not-found.error';
import type { DeleteBankAccountDto } from '../../dtos/bank-account.dto';

/**
 * Exclui a conta bancária (soft-delete).
 *
 * Nunca apaga: lançamentos financeiros e pagamentos de venda já registrados
 * apontam para ela, e o extrato precisa continuar resolvendo.
 */
@Injectable()
export class DeleteBankAccountUseCase implements IUseCase<
  DeleteBankAccountDto,
  void
> {
  constructor(private readonly bankAccountRepository: BankAccountRepository) {}

  async execute(input: DeleteBankAccountDto): Promise<void> {
    const bankAccount = await this.bankAccountRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!bankAccount || bankAccount.deletedAt) {
      throw new BankAccountNotFoundError(input.id);
    }

    const deleted = bankAccount.softDelete();
    await this.bankAccountRepository.softDelete(
      input.organizationId,
      input.id,
      deleted.deletedAt ?? new Date(),
    );
  }
}

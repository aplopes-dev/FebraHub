import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { BankAccount } from '../../../domain/entities/bank-account.entity';
import { BankAccountRepository } from '../../../domain/repositories/bank-account.repository.interface';
import { BankAccountNotFoundError } from '../../../domain/errors/bank-account-not-found.error';
import type { UpdateBankAccountDto } from '../../dtos/bank-account.dto';

@Injectable()
export class UpdateBankAccountUseCase implements IUseCase<
  UpdateBankAccountDto,
  BankAccount
> {
  constructor(private readonly bankAccountRepository: BankAccountRepository) {}

  async execute(input: UpdateBankAccountDto): Promise<BankAccount> {
    const bankAccount = await this.bankAccountRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!bankAccount || bankAccount.deletedAt) {
      throw new BankAccountNotFoundError(input.id);
    }

    return this.bankAccountRepository.save(
      bankAccount.update({
        name: input.name,
        bankName: input.bankName,
        bankCode: input.bankCode,
        openingBalanceCents: input.openingBalanceCents,
        openedAt: input.openedAt,
        branchIds: input.branchIds,
      }),
    );
  }
}

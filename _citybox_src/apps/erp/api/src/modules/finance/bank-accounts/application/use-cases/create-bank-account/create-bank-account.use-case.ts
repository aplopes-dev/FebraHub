import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { BankAccount } from '../../../domain/entities/bank-account.entity';
import { BankAccountRepository } from '../../../domain/repositories/bank-account.repository.interface';
import type { CreateBankAccountDto } from '../../dtos/bank-account.dto';

@Injectable()
export class CreateBankAccountUseCase implements IUseCase<
  CreateBankAccountDto,
  BankAccount
> {
  constructor(private readonly bankAccountRepository: BankAccountRepository) {}

  async execute(input: CreateBankAccountDto): Promise<BankAccount> {
    // Sem checagem de nome duplicado: duas contas do mesmo banco podem ter o
    // mesmo apelido, e o operador distingue pela unidade atendida.
    const bankAccount = BankAccount.create({
      organizationId: input.organizationId,
      name: input.name,
      bankName: input.bankName,
      bankCode: input.bankCode,
      openingBalanceCents: input.openingBalanceCents,
      openedAt: input.openedAt,
      branchIds: input.branchIds,
    });

    return this.bankAccountRepository.save(bankAccount);
  }
}

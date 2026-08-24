import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialAccount } from '../../../domain/entities/financial-account.entity';
import { FinancialAccountRepository } from '../../../domain/repositories/financial-account.repository.interface';
import type { CreateFinancialAccountDto } from '../../dtos/financial-account.dto';

@Injectable()
export class CreateFinancialAccountUseCase implements IUseCase<
  CreateFinancialAccountDto,
  FinancialAccount
> {
  constructor(private readonly accountRepository: FinancialAccountRepository) {}

  async execute(dto: CreateFinancialAccountDto): Promise<FinancialAccount> {
    const account = FinancialAccount.create({
      storeId: dto.storeId,
      name: dto.name.trim(),
      type: dto.type?.trim() || 'checking',
    });
    return this.accountRepository.save(account);
  }
}

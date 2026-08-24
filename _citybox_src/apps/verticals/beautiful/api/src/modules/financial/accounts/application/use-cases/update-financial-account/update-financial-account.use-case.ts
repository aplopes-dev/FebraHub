import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialAccount } from '../../../domain/entities/financial-account.entity';
import { FinancialAccountRepository } from '../../../domain/repositories/financial-account.repository.interface';
import { FinancialAccountNotFoundError } from '../../../domain/errors/financial-account-not-found.error';
import type { UpdateFinancialAccountDto } from '../../dtos/financial-account.dto';

@Injectable()
export class UpdateFinancialAccountUseCase implements IUseCase<
  UpdateFinancialAccountDto,
  FinancialAccount
> {
  constructor(private readonly accountRepository: FinancialAccountRepository) {}

  async execute(dto: UpdateFinancialAccountDto): Promise<FinancialAccount> {
    const existing = await this.accountRepository.findById(
      dto.storeId,
      dto.accountId,
    );
    if (!existing) {
      throw new FinancialAccountNotFoundError(
        UpdateFinancialAccountUseCase.name,
        dto.accountId,
      );
    }

    const updated = existing.withUpdate({
      name: dto.name !== undefined ? dto.name.trim() : undefined,
      type: dto.type !== undefined ? dto.type.trim() : undefined,
      isActive: dto.isActive,
    });

    return this.accountRepository.save(updated);
  }
}

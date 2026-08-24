import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { BankStatement } from '../../../domain/entities/bank-statement.entity';
import { BankStatementRepository } from '../../../domain/repositories/bank-statement.repository.interface';
import { BankStatementNotFoundError } from '../../../domain/errors/bank-statement-not-found.error';
import type { FindBankStatementByIdDto } from '../../dtos/bank-statement.dto';

@Injectable()
export class FindBankStatementByIdUseCase implements IUseCase<
  FindBankStatementByIdDto,
  BankStatement
> {
  constructor(
    private readonly bankStatementRepository: BankStatementRepository,
  ) {}

  async execute(input: FindBankStatementByIdDto): Promise<BankStatement> {
    const bankStatement = await this.bankStatementRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!bankStatement) {
      throw new BankStatementNotFoundError(input.id);
    }
    return bankStatement;
  }
}

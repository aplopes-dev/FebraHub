import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { BankStatementRepository } from '../../../domain/repositories/bank-statement.repository.interface';
import { BankStatementTransactionRepository } from '../../../domain/repositories/bank-statement-transaction.repository.interface';
import { BankStatementNotFoundError } from '../../../domain/errors/bank-statement-not-found.error';
import { BankStatementTransactionNotFoundError } from '../../../domain/errors/bank-statement-transaction-not-found.error';
import { BankStatementTransactionNotPendingError } from '../../../domain/errors/bank-statement-transaction-not-pending.error';
import type {
  DiscardTransactionDto,
  DiscardTransactionResult,
} from '../../dtos/discard-transaction.dto';

/**
 * Excluir uma transação pendente da conciliação (FR-019) — move para o grupo
 * Excluídas sem apagá-la. Só se aplica a transações `pending`; uma transação
 * `reconciled` precisa passar primeiro por `undo-reconciliation` (decisão de
 * `/speckit-clarify` 2026-08-10).
 */
@Injectable()
export class DiscardTransactionUseCase implements IUseCase<
  DiscardTransactionDto,
  DiscardTransactionResult
> {
  constructor(
    private readonly bankStatementRepository: BankStatementRepository,
    private readonly bankStatementTransactionRepository: BankStatementTransactionRepository,
  ) {}

  async execute(
    input: DiscardTransactionDto,
  ): Promise<DiscardTransactionResult> {
    const bankStatement = await this.bankStatementRepository.findById(
      input.organizationId,
      input.bankStatementId,
    );
    if (!bankStatement) {
      throw new BankStatementNotFoundError(input.bankStatementId);
    }

    const transaction = await this.bankStatementTransactionRepository.findById(
      input.organizationId,
      input.transactionId,
    );
    if (!transaction || transaction.bankStatementId !== input.bankStatementId) {
      throw new BankStatementTransactionNotFoundError(input.transactionId);
    }
    if (transaction.status !== 'pending') {
      throw new BankStatementTransactionNotPendingError(transaction.id);
    }

    const discardedTransaction = transaction.discard();
    await this.bankStatementTransactionRepository.save(discardedTransaction);

    const counts =
      await this.bankStatementTransactionRepository.countByStatement(
        input.organizationId,
        input.bankStatementId,
      );
    const updatedStatement = bankStatement.withRecalculatedCounts(counts);
    await this.bankStatementRepository.save(updatedStatement);

    return {
      bankStatement: updatedStatement,
      transaction: discardedTransaction,
    };
  }
}

import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { BankStatementRepository } from '../../../domain/repositories/bank-statement.repository.interface';
import { BankStatementTransactionRepository } from '../../../domain/repositories/bank-statement-transaction.repository.interface';
import { BankStatementMatchRepository } from '../../../domain/repositories/bank-statement-match.repository.interface';
import { BankStatementNotFoundError } from '../../../domain/errors/bank-statement-not-found.error';
import { BankStatementTransactionNotFoundError } from '../../../domain/errors/bank-statement-transaction-not-found.error';
import { BankStatementTransactionNotReconciledError } from '../../../domain/errors/bank-statement-transaction-not-reconciled.error';
import type {
  UndoReconciliationDto,
  UndoReconciliationResult,
} from '../../dtos/undo-reconciliation.dto';

/**
 * Desfaz a conciliação de uma transação (`specs/erp/007-financeiro-ajustes-ui`
 * US10, `research.md` R9) — fecha um gap pré-existente: o frontend já chamava
 * esta rota (`undoReconciliationApi`) e `BankStatementTransaction.
 * undoReconciliation()` já existia, mas nenhum use-case os ligava.
 *
 * Não remove o `FinancialEntryPayment` criado pela conciliação original —
 * fica como pagamento manual no lançamento até o usuário ajustar (decisão
 * de menor risco de perda de dado silenciosa, ver `contracts/
 * financial-entry-delete-guard.md`). O que libera o lançamento para
 * exclusão (FR-006f) é só o `BankStatementMatch` deixar de existir —
 * `DeleteFinancialEntryUseCase` consulta exatamente isso.
 */
@Injectable()
export class UndoReconciliationUseCase implements IUseCase<
  UndoReconciliationDto,
  UndoReconciliationResult
> {
  constructor(
    private readonly bankStatementRepository: BankStatementRepository,
    private readonly bankStatementTransactionRepository: BankStatementTransactionRepository,
    private readonly bankStatementMatchRepository: BankStatementMatchRepository,
  ) {}

  async execute(
    input: UndoReconciliationDto,
  ): Promise<UndoReconciliationResult> {
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
    if (transaction.status !== 'reconciled') {
      throw new BankStatementTransactionNotReconciledError(transaction.id);
    }

    const undoneTransaction = transaction.undoReconciliation();
    await this.bankStatementTransactionRepository.save(undoneTransaction);

    // Hard-delete — o vínculo só existe enquanto a conciliação está ativa
    // (comentário de `bank-statement-match.repository.interface.ts`, D6 de
    // `006-bank-reconciliation`). É esta remoção que faz
    // `findActiveFinancialEntryIds` parar de listar o lançamento.
    await this.bankStatementMatchRepository.deleteByTransactionId(
      input.organizationId,
      transaction.id,
    );

    const counts =
      await this.bankStatementTransactionRepository.countByStatement(
        input.organizationId,
        input.bankStatementId,
      );
    const updatedStatement = bankStatement.withRecalculatedCounts(counts);
    await this.bankStatementRepository.save(updatedStatement);

    return {
      bankStatement: updatedStatement,
      transaction: undoneTransaction,
    };
  }
}

import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../../shared/domain/storage/object-storage.interface';
import { BankStatementRepository } from '../../../domain/repositories/bank-statement.repository.interface';
import { BankStatementTransactionRepository } from '../../../domain/repositories/bank-statement-transaction.repository.interface';
import { BankStatementNotFoundError } from '../../../domain/errors/bank-statement-not-found.error';
import { BankStatementHasReconciliationError } from '../../../domain/errors/bank-statement-has-reconciliation.error';

export type DeleteBankStatementDto = {
  organizationId: string;
  bankStatementId: string;
};

/**
 * Excluir um extrato importado (FR-045, decisão de 2026-08-14).
 *
 * É **hard delete**, não soft-delete, de propósito: o objetivo declarado é
 * liberar as chaves de dedupe das transações para o arquivo poder ser
 * reimportado. Um extrato "excluído" que continuasse no banco manteria as
 * transações e o problema.
 *
 * Recusa enquanto houver transação conciliada — desfazer altera saldo de conta
 * bancária e status de lançamento, e isso não pode acontecer escondido atrás de
 * um botão de excluir (mesma regra da FR-019 para transação).
 */
@Injectable()
export class DeleteBankStatementUseCase implements IUseCase<
  DeleteBankStatementDto,
  void
> {
  constructor(
    private readonly bankStatementRepository: BankStatementRepository,
    private readonly bankStatementTransactionRepository: BankStatementTransactionRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(input: DeleteBankStatementDto): Promise<void> {
    const bankStatement = await this.bankStatementRepository.findById(
      input.organizationId,
      input.bankStatementId,
    );
    if (!bankStatement) {
      throw new BankStatementNotFoundError(input.bankStatementId);
    }

    if (bankStatement.reconciledCount > 0) {
      throw new BankStatementHasReconciliationError(
        bankStatement.reconciledCount,
      );
    }

    // Ordem importa: transações primeiro (é o que libera a dedupe), depois o
    // extrato. O arquivo sai por último e sem derrubar a operação se falhar —
    // um objeto órfão no storage é menos grave do que um extrato que o operador
    // não consegue apagar, que é o problema que esta funcionalidade resolve.
    await this.bankStatementTransactionRepository.deleteByStatement(
      input.organizationId,
      input.bankStatementId,
    );
    await this.bankStatementRepository.delete(
      input.organizationId,
      input.bankStatementId,
    );

    try {
      await this.storage.delete(bankStatement.objectKey);
    } catch {
      // Intencionalmente silencioso: ver comentário acima.
    }
  }
}

import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialEntryRepository } from '../../../../financial-entries/domain/repositories/financial-entry.repository.interface';
import { FinancialEntryNotFoundError } from '../../../../financial-entries/domain/errors/financial-entry-not-found.error';
import { BankStatementRepository } from '../../../domain/repositories/bank-statement.repository.interface';
import { BankStatementTransactionRepository } from '../../../domain/repositories/bank-statement-transaction.repository.interface';
import { BankStatementMatchRepository } from '../../../domain/repositories/bank-statement-match.repository.interface';
import { BankStatementMatch } from '../../../domain/entities/bank-statement-match.entity';
import { BankStatementNotFoundError } from '../../../domain/errors/bank-statement-not-found.error';
import { BankStatementTransactionNotFoundError } from '../../../domain/errors/bank-statement-transaction-not-found.error';
import { BankStatementTransactionNotPendingError } from '../../../domain/errors/bank-statement-transaction-not-pending.error';
import { FinancialEntryAlreadyReconciledError } from '../../../domain/errors/financial-entry-already-reconciled.error';
import { FinancialEntryPaymentAmbiguousError } from '../../../domain/errors/financial-entry-payment-ambiguous.error';
import { ReconciliationSumMismatchError } from '../../../domain/errors/reconciliation-sum-mismatch.error';
import { calculateEligibleAmountCents } from '../../../domain/services/eligible-amount';
import type {
  ReconcileTransactionDto,
  ReconcileTransactionResult,
} from '../../dtos/reconcile-transaction.dto';

/**
 * Cobre sugestão (1 id), busca manual (1 id) e soma de N lançamentos (N ids)
 * — um único fluxo para as três User Stories (research.md D7).
 */
@Injectable()
export class ReconcileTransactionUseCase implements IUseCase<
  ReconcileTransactionDto,
  ReconcileTransactionResult
> {
  constructor(
    private readonly bankStatementRepository: BankStatementRepository,
    private readonly bankStatementTransactionRepository: BankStatementTransactionRepository,
    private readonly bankStatementMatchRepository: BankStatementMatchRepository,
    private readonly financialEntryRepository: FinancialEntryRepository,
  ) {}

  async execute(
    input: ReconcileTransactionDto,
  ): Promise<ReconcileTransactionResult> {
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

    const entries = await Promise.all(
      input.financialEntryIds.map(async (id) => {
        const entry = await this.financialEntryRepository.findById(
          input.organizationId,
          id,
        );
        if (!entry || entry.deletedAt) {
          throw new FinancialEntryNotFoundError(id);
        }
        return entry;
      }),
    );

    // FR-033 explícito (research.md D16/D17) — status não implica mais
    // exclusão sozinho, já que `paid` sem vínculo ativo também é elegível.
    const activeIds =
      await this.bankStatementMatchRepository.findActiveFinancialEntryIds(
        input.organizationId,
        entries.map((entry) => entry.id),
      );
    for (const entry of entries) {
      if (activeIds.has(entry.id)) {
        throw new FinancialEntryAlreadyReconciledError(entry.id);
      }
      // D16 — um lançamento `paid` só concilia por vínculo quando dá para
      // identificar sem ambiguidade qual pagamento vincular.
      if (entry.status === 'paid' && entry.payments.length !== 1) {
        throw new FinancialEntryPaymentAmbiguousError(entry.id);
      }
    }

    // Validação ANTES de qualquer escrita (FR-017/US4) — nenhuma escrita
    // parcial acontece se a soma não fechar.
    const eligibleAmounts = entries.map(calculateEligibleAmountCents);
    const sumCents = eligibleAmounts.reduce((total, cents) => total + cents, 0);
    if (sumCents !== transaction.amountCents) {
      throw new ReconciliationSumMismatchError(
        transaction.amountCents,
        sumCents,
      );
    }

    const matches: BankStatementMatch[] = [];
    for (const [index, entry] of entries.entries()) {
      const eligibleAmountCents = eligibleAmounts[index];

      // D16 — `paid`: vínculo apenas, sem `addPayment`/`save()` (a
      // movimentação bancária do pagamento já existe desde que ele foi
      // registrado; criar outra duplicaria o saldo).
      if (entry.status === 'paid') {
        matches.push(
          BankStatementMatch.create(
            {
              organizationId: input.organizationId,
              bankStatementTransactionId: transaction.id,
              financialEntryId: entry.id,
              financialEntryPaymentId: entry.payments[0].id,
              amountCents: eligibleAmountCents,
            },
            randomUUID(),
          ),
        );
        continue;
      }

      const paymentId = randomUUID();
      const updatedEntry = entry.addPayment({
        id: paymentId,
        amountCents: eligibleAmountCents,
        paidAt: transaction.postedAt,
        paymentMethod: 'conciliacao_bancaria',
        cardBrand: null,
      });
      await this.financialEntryRepository.save(updatedEntry);

      matches.push(
        BankStatementMatch.create(
          {
            organizationId: input.organizationId,
            bankStatementTransactionId: transaction.id,
            financialEntryId: entry.id,
            financialEntryPaymentId: paymentId,
            amountCents: eligibleAmountCents,
          },
          randomUUID(),
        ),
      );
    }
    await this.bankStatementMatchRepository.saveMany(matches);

    const reconciledTransaction = transaction.reconcile();
    await this.bankStatementTransactionRepository.save(reconciledTransaction);

    const counts =
      await this.bankStatementTransactionRepository.countByStatement(
        input.organizationId,
        input.bankStatementId,
      );
    const updatedStatement = bankStatement.withRecalculatedCounts(counts);
    await this.bankStatementRepository.save(updatedStatement);

    return {
      bankStatement: updatedStatement,
      transaction: reconciledTransaction,
      matches,
    };
  }
}

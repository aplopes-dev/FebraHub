import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { FinancialEntryRepository } from '../../../../financial-entries/domain/repositories/financial-entry.repository.interface';
import type { FinancialEntryOperation } from '../../../../financial-entries/domain/entities/financial-entry.entity';
import { BankStatementTransactionRepository } from '../../../domain/repositories/bank-statement-transaction.repository.interface';
import { BankStatementTransactionNotFoundError } from '../../../domain/errors/bank-statement-transaction-not-found.error';
import {
  suggestMatches,
  MATCH_DATE_WINDOW_DAYS,
  type MatchSuggestionResult,
} from '../../../domain/services/match-suggester';

export type SuggestMatchesDto = {
  organizationId: string;
  bankStatementId: string;
  transactionId: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function operationForKind(kind: 'credit' | 'debit'): FinancialEntryOperation {
  return kind === 'credit' ? 'receivable' : 'payable';
}

@Injectable()
export class SuggestMatchesUseCase implements IUseCase<
  SuggestMatchesDto,
  MatchSuggestionResult
> {
  constructor(
    private readonly bankStatementTransactionRepository: BankStatementTransactionRepository,
    private readonly financialEntryRepository: FinancialEntryRepository,
  ) {}

  async execute(input: SuggestMatchesDto): Promise<MatchSuggestionResult> {
    const transaction = await this.bankStatementTransactionRepository.findById(
      input.organizationId,
      input.transactionId,
    );
    if (!transaction || transaction.bankStatementId !== input.bankStatementId) {
      throw new BankStatementTransactionNotFoundError(input.transactionId);
    }

    const windowMs = MATCH_DATE_WINDOW_DAYS * DAY_MS;
    const candidates =
      await this.financialEntryRepository.findReconciliationCandidates(
        input.organizationId,
        {
          bankAccountId: transaction.bankAccountId ?? undefined,
          operation: operationForKind(transaction.kind),
          dueDateFrom: new Date(transaction.postedAt.getTime() - windowMs),
          dueDateTo: new Date(transaction.postedAt.getTime() + windowMs),
        },
      );

    return suggestMatches(
      transaction.amountCents,
      transaction.postedAt,
      transaction.memo,
      candidates,
    );
  }
}

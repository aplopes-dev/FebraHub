import type { BankStatementMatch } from '../entities/bank-statement-match.entity';

export abstract class BankStatementMatchRepository {
  abstract findByTransactionId(
    organizationId: string,
    bankStatementTransactionId: string,
  ): Promise<BankStatementMatch[]>;

  /** Todos os `financialEntryId` com um vínculo ativo — usado para excluir
   *  candidatos já conciliados de sugestão/busca/soma (FR-033). Redundante em
   *  relação a `FinancialEntry.status='pending'` (D7/D-note de research.md),
   *  mas mantido como checagem explícita de invariante em `reconcile-transaction`. */
  abstract findActiveFinancialEntryIds(
    organizationId: string,
    financialEntryIds: string[],
  ): Promise<Set<string>>;

  abstract saveMany(matches: BankStatementMatch[]): Promise<void>;

  /** Hard delete — o vínculo só existe enquanto ativo (research.md D6). */
  abstract deleteByTransactionId(
    organizationId: string,
    bankStatementTransactionId: string,
  ): Promise<void>;
}

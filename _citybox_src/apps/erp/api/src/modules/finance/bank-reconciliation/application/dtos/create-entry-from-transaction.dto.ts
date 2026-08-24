import type { BankStatement } from '../../domain/entities/bank-statement.entity';
import type { BankStatementTransaction } from '../../domain/entities/bank-statement-transaction.entity';
import type { BankStatementMatch } from '../../domain/entities/bank-statement-match.entity';
import type { FinancialEntry } from '../../../financial-entries/domain/entities/financial-entry.entity';

export type CreateEntryFromTransactionDto = {
  organizationId: string;
  bankStatementId: string;
  transactionId: string;
  /** Campos descritivos — os únicos que o formulário pode de fato alterar
   *  (research.md D9 / contracts/bank-statement-transaction.contract.md).
   *  `chartOfAccountId`/`costCenterId` não estavam no contrato original —
   *  adicionados nesta implementação porque `FinancialEntry.create()` exige
   *  ao menos uma linha de rateio (`assertAllocationsMatchTotal`), regra que
   *  passou a existir depois do desenho inicial desta feature. */
  description: string;
  partyName: string;
  /** Spec erp/031 D2 — mutuamente exclusivo com `supplierId`, checado no use-case. */
  customerId: string | null;
  /** Spec erp/031 D2 — mutuamente exclusivo com `customerId`, checado no use-case. */
  supplierId: string | null;
  categoryName: string;
  note: string;
  /** Editável (research.md D14, `/speckit-clarify` 2026-08-10) — pré-preenchido
   *  no cliente com `bankStatement.bankAccountId`, mas não travado: nem
   *  sempre o arquivo OFX identifica a conta com certeza. Diferente de
   *  valor/data/sinal, não afeta a conciliação com a transação de origem. */
  bankAccountId: string;
  chartOfAccountId: string;
  costCenterId: string;
};

export type CreateEntryFromTransactionResult = {
  bankStatement: BankStatement;
  transaction: BankStatementTransaction;
  financialEntry: FinancialEntry;
  match: BankStatementMatch;
};

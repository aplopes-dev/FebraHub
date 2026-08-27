export type BankAccount = {
  id: string;
  /** Apelido exibido na lista (ex.: "Caixa operacional"). */
  name: string;
  /** Identificador estável do catálogo de bancos — round-trip do `Select` (FR-015). */
  bankCode: string;
  bankName: string;
  /** ISO date `yyyy-MM-dd` — quando a conta começou no sistema. */
  openedAt: string;
  initialBalance: number;
  /** Saldo calculado (soma das movimentações) — nunca o saldo de abertura estático (FR-004). */
  currentBalance: number;
  /** Unidades/filiais que compartilham esta conta. */
  unitIds: string[];
};

export type BankAccountFormValues = {
  bankCode: string;
  /** Apelido opcional — em branco, a conta assume o nome do banco. */
  name: string;
  initialBalance: number;
  /** ISO date `yyyy-MM-dd`. */
  openedAt: string;
  unitIds: string[];
};

export type BankAccountListItem = BankAccount;

export type BankAccountListParams = {
  search: string;
  page: number;
  perPage: number;
};

export type BankAccountListResult = {
  data: BankAccountListItem[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

/**
 * `initial_balance` é o primeiro registro criado junto com a conta;
 * `credit` = entrada, `debit` = saída. `amount` é sempre positivo — o sinal
 * vem do `kind`.
 */
export type BankTransactionKind = "initial_balance" | "credit" | "debit";

export const BANK_TRANSACTION_KIND_LABELS: Record<BankTransactionKind, string> =
  {
    initial_balance: "Saldo inicial",
    credit: "Entrada",
    debit: "Saída",
  };

export type BankTransactionSourceType =
  | "initial_balance"
  | "financial_entry_payment"
  | "bank_transfer"
  | "reconciliation";

export type BankTransaction = {
  id: string;
  kind: BankTransactionKind;
  description: string;
  amount: number;
  sourceType: BankTransactionSourceType;
  /** Usuário responsável — vazio quando a origem não guarda essa informação. */
  createdByName: string;
  /** Data de efetivação (ISO date `yyyy-MM-dd`). */
  effectiveAt: string;
  createdAt: string;
};

export type BankAccountTransactionsParams = {
  kind?: BankTransactionKind;
  effectiveFrom?: string;
  effectiveTo?: string;
  page: number;
  perPage: number;
};

export type BankAccountTransactionsResult = {
  data: BankTransaction[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
};

export type BankStatementEntry = {
  transaction: BankTransaction;
  /** Saldo acumulado da conta após esta movimentação. */
  runningBalance: number;
};

export type BankAccountStatementParams = {
  page: number;
  perPage: number;
};

export type BankAccountStatementResult = {
  data: BankStatementEntry[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
};

/** Valor com sinal: créditos/saldo inicial somam, débitos subtraem. */
export function signedAmount(transaction: BankTransaction): number {
  return transaction.kind === "debit"
    ? -transaction.amount
    : transaction.amount;
}

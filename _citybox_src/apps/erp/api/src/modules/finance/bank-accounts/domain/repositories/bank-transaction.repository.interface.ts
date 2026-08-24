import type {
  BankTransaction,
  BankTransactionKind,
} from '../entities/bank-transaction.entity';

export type BankTransactionListCriteria = {
  kind?: BankTransactionKind;
  /** Filtra por `effectiveAt >=` (inclusive). */
  effectiveFrom?: Date;
  /** Filtra por `effectiveAt <=` (inclusive). */
  effectiveTo?: Date;
  skip?: number;
  take?: number;
};

/**
 * Leitura do livro-razão. Escritas **não** passam por aqui: cada agregado que
 * gera movimentação (`BankAccount`, `FinancialEntry`, `BankTransfer`) grava
 * direto via `tx.bankTransaction.*` dentro da própria transação — mesmo
 * padrão já usado por `PrismaSaleOrderRepository.maybeCreateReceivable` para
 * escrever em `FinancialEntry` sem importar o módulo de finanças (ver
 * `specs/erp/002-bank-account-ledger/research.md` D1).
 */
export abstract class BankTransactionRepository {
  /**
   * Saldo atual de cada conta pedida — soma com sinal de todas as
   * movimentações (`initial_balance`/`credit` somam, `debit` subtrai).
   * Contas sem nenhuma movimentação não aparecem no resultado (tratar como
   * zero no chamador).
   */
  abstract sumBalancesByAccountIds(
    organizationId: string,
    bankAccountIds: string[],
  ): Promise<Record<string, number>>;

  abstract countByAccount(
    organizationId: string,
    bankAccountId: string,
    criteria?: Omit<BankTransactionListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  /** Lista analítica (aba Transações) — filtrável por tipo/período. */
  abstract findByAccount(
    organizationId: string,
    bankAccountId: string,
    criteria: BankTransactionListCriteria,
  ): Promise<BankTransaction[]>;

  /**
   * As `limit` movimentações mais recentes da conta (`ORDER BY effectiveAt
   * DESC, createdAt DESC, id DESC` — tiebreak determinístico), usada para
   * calcular o saldo acumulado do extrato caminhando do saldo total para
   * baixo (ver `research.md` D3).
   */
  abstract findOrderedThrough(
    organizationId: string,
    bankAccountId: string,
    limit: number,
  ): Promise<BankTransaction[]>;
}

import type {
  BankStatementTransaction,
  BankStatementTransactionStatus,
} from '../entities/bank-statement-transaction.entity';
import type { BankStatementCounts } from '../entities/bank-statement.entity';

export type BankStatementTransactionListCriteria = {
  status: BankStatementTransactionStatus;
  /** Busca por memo (RN-15) — case-insensitive, substring. */
  search?: string;
  /** Filtro de período sobre `postedAt` (FR-035, research.md D15) — rótulo
   *  na UI é "Período", nunca "vencimento" (a transação de extrato não tem
   *  data de vencimento). */
  postedFrom?: Date;
  postedTo?: Date;
  skip?: number;
  take?: number;
};

export abstract class BankStatementTransactionRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<BankStatementTransaction | null>;

  abstract findByStatement(
    organizationId: string,
    bankStatementId: string,
    criteria: BankStatementTransactionListCriteria,
  ): Promise<BankStatementTransaction[]>;

  abstract count(
    organizationId: string,
    bankStatementId: string,
    criteria: Omit<BankStatementTransactionListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  /** Contadores por status — recalcula `BankStatement.status`/contadores (FR-022). */
  abstract countByStatement(
    organizationId: string,
    bankStatementId: string,
  ): Promise<BankStatementCounts>;

  /**
   * Quais dos `dedupeKeys` informados já existem na organização (em qualquer
   * extrato já importado, de qualquer conta) — usado pelo dedupe no import
   * (RN-21, chave por organização desde 007-financeiro-ajustes-ui FR-007 —
   * antes era por conta; `computeDedupeKey` já namespaceia por
   * banco+conta do próprio arquivo, então isso não reabre risco de colisão
   * entre contas diferentes).
   */
  /**
   * Chaves de dedupe já presentes na organização (FR-007/FR-027).
   *
   * **Ignora transações `discarded`** (decisão de 2026-08-14): excluir uma
   * transação significa "não vou tratar isso", não "nunca mais importe este
   * arquivo". Enquanto as excluídas contavam, um extrato descartado envenenava
   * o arquivo para sempre — reimportar devolvia um extrato **vazio**, sem saída,
   * porque também não havia como apagar o extrato. Comportamento observado no
   * CPLUG: reimportar o mesmo arquivo devolve um extrato utilizável.
   */
  abstract findExistingDedupeKeys(
    organizationId: string,
    dedupeKeys: string[],
  ): Promise<Set<string>>;

  /** Remove todas as transações de um extrato (FR-045) — hard delete. */
  abstract deleteByStatement(
    organizationId: string,
    bankStatementId: string,
  ): Promise<void>;

  /**
   * Remove as transações **excluídas** cujas chaves de dedupe estão na lista
   * (FR-046) — chamado pela importação logo antes de inserir.
   *
   * Necessário porque o banco tem `@@unique([organizationId, dedupeKey])`:
   * ignorar as excluídas só na *checagem* faria a inserção violar a constraint
   * (P2002). Reimportar supersede o que havia sido descartado — as transações
   * voltam como pendentes, que é o efeito pretendido.
   *
   * Devolve os ids dos extratos que perderam transações, para quem chama
   * recalcular os contadores denormalizados deles (`discardedCount` ficaria
   * contando linhas que não existem mais).
   */
  abstract deleteDiscardedByDedupeKeys(
    organizationId: string,
    dedupeKeys: string[],
  ): Promise<string[]>;

  abstract save(
    transaction: BankStatementTransaction,
  ): Promise<BankStatementTransaction>;

  /** Inserção em lote das transações novas de uma importação. */
  abstract saveMany(transactions: BankStatementTransaction[]): Promise<void>;
}

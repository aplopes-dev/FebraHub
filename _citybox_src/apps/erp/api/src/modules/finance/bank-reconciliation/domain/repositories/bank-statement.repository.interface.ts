import type {
  BankStatement,
  BankStatementStatus,
} from '../entities/bank-statement.entity';

export type BankStatementListCriteria = {
  bankAccountId?: string;
  status?: BankStatementStatus;
  skip?: number;
  take?: number;
};

export abstract class BankStatementRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<BankStatement | null>;

  abstract findAll(
    organizationId: string,
    criteria?: BankStatementListCriteria,
  ): Promise<BankStatement[]>;

  abstract count(
    organizationId: string,
    criteria?: Omit<BankStatementListCriteria, 'skip' | 'take'>,
  ): Promise<number>;

  /**
   * Remove o extrato **de verdade** (FR-045, decisão de 2026-08-14) — não é
   * soft-delete: o objetivo é liberar as chaves de dedupe das transações para
   * o arquivo poder ser reimportado. Quem chama é responsável por apagar as
   * transações e o arquivo do storage antes.
   */
  abstract delete(organizationId: string, id: string): Promise<void>;

  abstract save(bankStatement: BankStatement): Promise<BankStatement>;
}

import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export const BANK_STATEMENT_STATUSES = [
  'not_reconciled',
  'partially_reconciled',
  'reconciled',
] as const;
export type BankStatementStatus = (typeof BANK_STATEMENT_STATUSES)[number];

export type BankStatementCounts = {
  pendingCount: number;
  reconciledCount: number;
  discardedCount: number;
};

export type BankStatementProps = {
  organizationId: string;
  /** Opcional desde 007-financeiro-ajustes-ui FR-007 — `null` quando o
   *  código do banco do arquivo não resolveu para exatamente 1 conta ativa
   *  da organização no momento da importação. */
  bankAccountId: string | null;
  bankName: string;
  bankCode: string;
  branchNumber: string;
  accountNumber: string;
  periodStart: Date;
  periodEnd: Date;
  status: BankStatementStatus;
  pendingCount: number;
  reconciledCount: number;
  discardedCount: number;
  fileName: string;
  objectKey: string;
  importedByName: string;
  createdAt: Date;
  updatedAt: Date;
};

type CreateBankStatementProps = Optional<
  BankStatementProps,
  | 'bankName'
  | 'bankCode'
  | 'branchNumber'
  | 'accountNumber'
  | 'status'
  | 'pendingCount'
  | 'reconciledCount'
  | 'discardedCount'
  | 'importedByName'
  | 'createdAt'
  | 'updatedAt'
>;

/**
 * Extrato bancário importado em OFX. `status`/contadores são cache derivado
 * das transações (`recalculateCounts`) — nunca aceitos brutos de fora
 * (mesma convenção de `FinancialEntry.status`/`paidCents`).
 */
export class BankStatement extends Entity<BankStatementProps> {
  constructor(props: BankStatementProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    if (this.props.periodEnd < this.props.periodStart) {
      throw new Error(
        'BankStatement.periodEnd não pode ser anterior a periodStart',
      );
    }
  }

  public static create(
    props: CreateBankStatementProps,
    id?: string,
  ): BankStatement {
    const now = new Date();
    return new BankStatement(
      {
        organizationId: props.organizationId,
        bankAccountId: props.bankAccountId,
        bankName: props.bankName?.trim() ?? '',
        bankCode: props.bankCode?.trim() ?? '',
        branchNumber: props.branchNumber?.trim() ?? '',
        accountNumber: props.accountNumber?.trim() ?? '',
        periodStart: props.periodStart,
        periodEnd: props.periodEnd,
        status: props.status ?? 'not_reconciled',
        pendingCount: props.pendingCount ?? 0,
        reconciledCount: props.reconciledCount ?? 0,
        discardedCount: props.discardedCount ?? 0,
        fileName: props.fileName,
        objectKey: props.objectKey,
        importedByName: props.importedByName?.trim() ?? '',
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  public static with(props: BankStatementProps, id: string): BankStatement {
    return new BankStatement(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get bankAccountId() {
    return this.props.bankAccountId;
  }
  get bankName() {
    return this.props.bankName;
  }
  get bankCode() {
    return this.props.bankCode;
  }
  get branchNumber() {
    return this.props.branchNumber;
  }
  get accountNumber() {
    return this.props.accountNumber;
  }
  get periodStart() {
    return this.props.periodStart;
  }
  get periodEnd() {
    return this.props.periodEnd;
  }
  get status() {
    return this.props.status;
  }
  get pendingCount() {
    return this.props.pendingCount;
  }
  get reconciledCount() {
    return this.props.reconciledCount;
  }
  get discardedCount() {
    return this.props.discardedCount;
  }
  get fileName() {
    return this.props.fileName;
  }
  get objectKey() {
    return this.props.objectKey;
  }
  get importedByName() {
    return this.props.importedByName;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  /**
   * Recalcula `status` a partir dos contadores das transações (FR-011/FR-022).
   * Chamada pelos use cases de conciliar/desfazer/excluir depois de contar as
   * transações do extrato — nunca calculada implicitamente aqui dentro
   * (a entidade não conhece a lista de transações).
   */
  withRecalculatedCounts(counts: BankStatementCounts): BankStatement {
    const status = BankStatement.deriveStatus(counts);
    return BankStatement.with(
      {
        ...this.props,
        pendingCount: counts.pendingCount,
        reconciledCount: counts.reconciledCount,
        discardedCount: counts.discardedCount,
        status,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /**
   * FR-011: "tratada" = conciliada ou excluída (ambas saem de Pendentes).
   * `reconciled` exige que ao menos uma transação exista e nenhuma pendente
   * reste — um extrato sem nenhuma transação nunca é marcado `reconciled`.
   */
  private static deriveStatus(
    counts: BankStatementCounts,
  ): BankStatementStatus {
    const totalCount =
      counts.pendingCount + counts.reconciledCount + counts.discardedCount;
    const treatedCount = counts.reconciledCount + counts.discardedCount;

    if (totalCount === 0 || treatedCount === 0) {
      return 'not_reconciled';
    }
    if (counts.pendingCount === 0) {
      return 'reconciled';
    }
    return 'partially_reconciled';
  }
}

import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export const BANK_STATEMENT_TRANSACTION_STATUSES = [
  'pending',
  'reconciled',
  'discarded',
] as const;
export type BankStatementTransactionStatus =
  (typeof BANK_STATEMENT_TRANSACTION_STATUSES)[number];

export const BANK_STATEMENT_TRANSACTION_KINDS = ['credit', 'debit'] as const;
export type BankStatementTransactionKind =
  (typeof BANK_STATEMENT_TRANSACTION_KINDS)[number];

export type BankStatementTransactionProps = {
  organizationId: string;
  bankStatementId: string;
  bankAccountId: string | null;
  fitId: string;
  dedupeKey: string;
  postedAt: Date;
  /** Sempre positivo — o sinal vem de `kind`, nunca daqui. */
  amountCents: number;
  kind: BankStatementTransactionKind;
  transactionType: string;
  memo: string;
  status: BankStatementTransactionStatus;
  reconciledAt: Date | null;
  discardedAt: Date | null;
  createdAt: Date;
};

type CreateBankStatementTransactionProps = Optional<
  BankStatementTransactionProps,
  | 'fitId'
  | 'transactionType'
  | 'memo'
  | 'status'
  | 'reconciledAt'
  | 'discardedAt'
  | 'createdAt'
>;

/**
 * Uma linha extraída do OFX (RN-06/RN-07/RN-08). Sinal e valor sempre juntos:
 * `amountCents` positivo + `kind` — nunca um valor negativo persistido.
 */
export class BankStatementTransaction extends Entity<BankStatementTransactionProps> {
  constructor(props: BankStatementTransactionProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    if (this.props.amountCents <= 0) {
      throw new Error('BankStatementTransaction.amountCents deve ser positivo');
    }
  }

  public static create(
    props: CreateBankStatementTransactionProps,
    id?: string,
  ): BankStatementTransaction {
    return new BankStatementTransaction(
      {
        organizationId: props.organizationId,
        bankStatementId: props.bankStatementId,
        bankAccountId: props.bankAccountId,
        fitId: props.fitId?.trim() ?? '',
        dedupeKey: props.dedupeKey,
        postedAt: props.postedAt,
        amountCents: props.amountCents,
        kind: props.kind,
        transactionType: props.transactionType?.trim() ?? '',
        memo: props.memo?.trim() ?? '',
        status: props.status ?? 'pending',
        reconciledAt: props.reconciledAt ?? null,
        discardedAt: props.discardedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }

  public static with(
    props: BankStatementTransactionProps,
    id: string,
  ): BankStatementTransaction {
    return new BankStatementTransaction(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get bankStatementId() {
    return this.props.bankStatementId;
  }
  get bankAccountId() {
    return this.props.bankAccountId;
  }
  get fitId() {
    return this.props.fitId;
  }
  get dedupeKey() {
    return this.props.dedupeKey;
  }
  get postedAt() {
    return this.props.postedAt;
  }
  get amountCents() {
    return this.props.amountCents;
  }
  get kind() {
    return this.props.kind;
  }
  get transactionType() {
    return this.props.transactionType;
  }
  get memo() {
    return this.props.memo;
  }
  get status() {
    return this.props.status;
  }
  get reconciledAt() {
    return this.props.reconciledAt;
  }
  get discardedAt() {
    return this.props.discardedAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }

  /** Valor com sinal — entrada positiva, saída negativa (RN-07). */
  get signedAmountCents(): number {
    return this.kind === 'debit' ? -this.amountCents : this.amountCents;
  }

  reconcile(): BankStatementTransaction {
    return BankStatementTransaction.with(
      { ...this.props, status: 'reconciled', reconciledAt: new Date() },
      this.id,
    );
  }

  discard(): BankStatementTransaction {
    return BankStatementTransaction.with(
      { ...this.props, status: 'discarded', discardedAt: new Date() },
      this.id,
    );
  }

  /** Desfaz uma conciliação (FR-020) — volta para pendente, remove o carimbo. */
  undoReconciliation(): BankStatementTransaction {
    return BankStatementTransaction.with(
      { ...this.props, status: 'pending', reconciledAt: null },
      this.id,
    );
  }
}

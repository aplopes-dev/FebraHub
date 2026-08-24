import { Entity } from '../../../../../shared/core/entity';

export const BANK_TRANSACTION_KINDS = [
  'initial_balance',
  'credit',
  'debit',
] as const;
export type BankTransactionKind = (typeof BANK_TRANSACTION_KINDS)[number];

export type BankTransactionSourceType =
  | 'initial_balance'
  | 'financial_entry_payment'
  | 'bank_transfer'
  | 'reconciliation';

export type BankTransactionProps = {
  organizationId: string;
  bankAccountId: string;
  kind: BankTransactionKind;
  description: string;
  /** Sempre positivo — o sinal do movimento vem de `kind`, nunca daqui. */
  amountCents: number;
  effectiveAt: Date;
  sourceType: BankTransactionSourceType;
  sourceId: string | null;
  /** Vazio quando a origem não guarda usuário responsável. */
  createdByName: string;
  createdAt: Date;
};

type CreateBankTransactionProps = Omit<
  BankTransactionProps,
  'description' | 'sourceId' | 'createdByName' | 'createdAt'
> & {
  description?: string;
  sourceId?: string | null;
  createdByName?: string;
  createdAt?: Date;
};

/**
 * Uma linha do livro-razão de uma conta bancária — imutável depois de criada
 * (RN-03). Nunca gravada com `amountCents <= 0`: o sinal do movimento é
 * sempre expresso por `kind`, nunca pelo valor.
 *
 * As origens `initial_balance`/`bank_transfer` são append-only de verdade;
 * `financial_entry_payment` é uma projeção ressincronizada a cada save do
 * lançamento de origem — ver `specs/erp/002-bank-account-ledger/research.md` D1.
 */
export class BankTransaction extends Entity<BankTransactionProps> {
  constructor(props: BankTransactionProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    if (this.props.amountCents <= 0) {
      throw new Error('BankTransaction.amountCents deve ser positivo');
    }
    if (!this.props.effectiveAt) {
      throw new Error('BankTransaction.effectiveAt é obrigatório');
    }
  }

  public static create(
    props: CreateBankTransactionProps,
    id?: string,
  ): BankTransaction {
    return new BankTransaction(
      {
        organizationId: props.organizationId,
        bankAccountId: props.bankAccountId,
        kind: props.kind,
        description: props.description?.trim() ?? '',
        amountCents: props.amountCents,
        effectiveAt: props.effectiveAt,
        sourceType: props.sourceType,
        sourceId: props.sourceId ?? null,
        createdByName: props.createdByName?.trim() ?? '',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: BankTransactionProps, id: string): BankTransaction {
    return new BankTransaction(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get bankAccountId() {
    return this.props.bankAccountId;
  }
  get kind() {
    return this.props.kind;
  }
  get description() {
    return this.props.description;
  }
  get amountCents() {
    return this.props.amountCents;
  }
  get effectiveAt() {
    return this.props.effectiveAt;
  }
  get sourceType() {
    return this.props.sourceType;
  }
  get sourceId() {
    return this.props.sourceId;
  }
  get createdByName() {
    return this.props.createdByName;
  }
  get createdAt() {
    return this.props.createdAt;
  }

  /** Valor com sinal: `initial_balance`/`credit` somam, `debit` subtrai. */
  get signedAmountCents(): number {
    return this.kind === 'debit' ? -this.amountCents : this.amountCents;
  }
}

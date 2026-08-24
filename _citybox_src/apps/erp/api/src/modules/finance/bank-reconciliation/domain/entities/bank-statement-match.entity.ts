import { Entity } from '../../../../../shared/core/entity';

export type BankStatementMatchProps = {
  organizationId: string;
  bankStatementTransactionId: string;
  financialEntryId: string;
  financialEntryPaymentId: string;
  amountCents: number;
  createdAt: Date;
};

type CreateBankStatementMatchProps = Omit<
  BankStatementMatchProps,
  'createdAt'
> & {
  createdAt?: Date;
};

/**
 * Vínculo N:1 transação↔lançamento (FR-017 — repasse agrupado). Existe só
 * enquanto a conciliação está ativa; desfazer é hard delete no repositório,
 * não um campo de status aqui (research.md D6 de 006-bank-reconciliation).
 */
export class BankStatementMatch extends Entity<BankStatementMatchProps> {
  constructor(props: BankStatementMatchProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    if (this.props.amountCents <= 0) {
      throw new Error('BankStatementMatch.amountCents deve ser positivo');
    }
  }

  public static create(
    props: CreateBankStatementMatchProps,
    id?: string,
  ): BankStatementMatch {
    return new BankStatementMatch(
      { ...props, createdAt: props.createdAt ?? new Date() },
      id,
    );
  }

  public static with(
    props: BankStatementMatchProps,
    id: string,
  ): BankStatementMatch {
    return new BankStatementMatch(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get bankStatementTransactionId() {
    return this.props.bankStatementTransactionId;
  }
  get financialEntryId() {
    return this.props.financialEntryId;
  }
  get financialEntryPaymentId() {
    return this.props.financialEntryPaymentId;
  }
  get amountCents() {
    return this.props.amountCents;
  }
  get createdAt() {
    return this.props.createdAt;
  }
}

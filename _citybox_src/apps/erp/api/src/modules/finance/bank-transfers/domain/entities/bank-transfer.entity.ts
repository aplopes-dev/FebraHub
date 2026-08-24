import { Entity } from '../../../../../shared/core/entity';

export type BankTransferProps = {
  organizationId: string;
  fromBankAccountId: string;
  toBankAccountId: string;
  amountCents: number;
  effectiveAt: Date;
  paymentMethod: string;
  costCenterId: string;
  description: string;
  createdByName: string;
  createdAt: Date;
};

type CreateBankTransferProps = Omit<
  BankTransferProps,
  'description' | 'createdByName' | 'createdAt'
> & {
  description?: string;
  createdByName?: string;
  createdAt?: Date;
};

/**
 * Transferência entre 2 contas bancárias da mesma organização. Imutável
 * depois de criada — FR-020, sem edição/cancelamento nesta fase; a correção
 * de um erro é uma nova transferência em sentido oposto.
 */
export class BankTransfer extends Entity<BankTransferProps> {
  constructor(props: BankTransferProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Validação de formato no DTO HTTP; mesma/conta-diferente é checado no
    // use case (precisa consultar as duas contas para dar 404 antes de 422).
  }

  public static create(
    props: CreateBankTransferProps,
    id?: string,
  ): BankTransfer {
    return new BankTransfer(
      {
        organizationId: props.organizationId,
        fromBankAccountId: props.fromBankAccountId,
        toBankAccountId: props.toBankAccountId,
        amountCents: props.amountCents,
        effectiveAt: props.effectiveAt,
        paymentMethod: props.paymentMethod,
        costCenterId: props.costCenterId,
        description: props.description?.trim() ?? '',
        createdByName: props.createdByName?.trim() ?? '',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: BankTransferProps, id: string): BankTransfer {
    return new BankTransfer(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get fromBankAccountId() {
    return this.props.fromBankAccountId;
  }
  get toBankAccountId() {
    return this.props.toBankAccountId;
  }
  get amountCents() {
    return this.props.amountCents;
  }
  get effectiveAt() {
    return this.props.effectiveAt;
  }
  get paymentMethod() {
    return this.props.paymentMethod;
  }
  get costCenterId() {
    return this.props.costCenterId;
  }
  get description() {
    return this.props.description;
  }
  get createdByName() {
    return this.props.createdByName;
  }
  get createdAt() {
    return this.props.createdAt;
  }
}

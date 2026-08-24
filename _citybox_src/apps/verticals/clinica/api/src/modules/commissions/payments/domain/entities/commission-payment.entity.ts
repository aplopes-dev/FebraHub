import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export type CommissionPaymentProps = {
  storeId: string;
  memberId: string;
  memberName: string;
  description: string;
  paymentDate: Date;
  accountId: string;
  paymentMethod: string;
  grossCents: number;
  discountCents: number;
  netCents: number;
  observation: string | null;
  expenseEntryId: string | null;
  accrualIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

export class CommissionPayment extends Entity<CommissionPaymentProps> {
  constructor(props: CommissionPaymentProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // Business rules enforced in use cases.
  }

  static create(
    props: Optional<
      CommissionPaymentProps,
      | 'discountCents'
      | 'observation'
      | 'expenseEntryId'
      | 'accrualIds'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: string,
  ): CommissionPayment {
    const now = new Date();
    return new CommissionPayment(
      {
        storeId: props.storeId,
        memberId: props.memberId,
        memberName: props.memberName,
        description: props.description,
        paymentDate: props.paymentDate,
        accountId: props.accountId,
        paymentMethod: props.paymentMethod,
        grossCents: props.grossCents,
        discountCents: props.discountCents ?? 0,
        netCents: props.netCents,
        observation: props.observation ?? null,
        expenseEntryId: props.expenseEntryId ?? null,
        accrualIds: props.accrualIds ?? [],
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  static with(props: CommissionPaymentProps, id: string): CommissionPayment {
    return new CommissionPayment(props, id);
  }

  withExpenseEntryId(expenseEntryId: string): CommissionPayment {
    return CommissionPayment.create(
      { ...this.props, expenseEntryId, updatedAt: new Date() },
      this.id,
    );
  }

  get storeId() {
    return this.props.storeId;
  }
  get memberId() {
    return this.props.memberId;
  }
  get memberName() {
    return this.props.memberName;
  }
  get description() {
    return this.props.description;
  }
  get paymentDate() {
    return this.props.paymentDate;
  }
  get accountId() {
    return this.props.accountId;
  }
  get paymentMethod() {
    return this.props.paymentMethod;
  }
  get grossCents() {
    return this.props.grossCents;
  }
  get discountCents() {
    return this.props.discountCents;
  }
  get netCents() {
    return this.props.netCents;
  }
  get observation() {
    return this.props.observation;
  }
  get expenseEntryId() {
    return this.props.expenseEntryId;
  }
  get accrualIds() {
    return this.props.accrualIds;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}

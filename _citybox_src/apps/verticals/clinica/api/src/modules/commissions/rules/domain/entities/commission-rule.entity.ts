import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import type {
  CommissionPaymentTrigger,
  CommissionType,
} from '../../../shared/domain/commission-enums';

export type CommissionRuleTreatmentProps = {
  treatmentId: string;
  amountCents: number;
  treatmentValueCents: number;
};

export type CommissionRuleProps = {
  storeId: string;
  memberId: string;
  memberName: string;
  paymentTrigger: CommissionPaymentTrigger;
  commissionType: CommissionType;
  percentageValue: number | null;
  commissionValueCents: number | null;
  allowValueExceedsTreatment: boolean;
  planId: string | null;
  specialtyId: string | null;
  treatments: CommissionRuleTreatmentProps[];
  createdAt: Date;
  updatedAt: Date;
};

export class CommissionRule extends Entity<CommissionRuleProps> {
  constructor(props: CommissionRuleProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // Business rules (single budget_approved rule, fixed-value ceiling) enforced in use cases.
  }

  static create(
    props: Optional<
      CommissionRuleProps,
      | 'percentageValue'
      | 'commissionValueCents'
      | 'allowValueExceedsTreatment'
      | 'planId'
      | 'specialtyId'
      | 'treatments'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: string,
  ): CommissionRule {
    const now = new Date();
    return new CommissionRule(
      {
        storeId: props.storeId,
        memberId: props.memberId,
        memberName: props.memberName,
        paymentTrigger: props.paymentTrigger,
        commissionType: props.commissionType,
        percentageValue: props.percentageValue ?? null,
        commissionValueCents: props.commissionValueCents ?? null,
        allowValueExceedsTreatment: props.allowValueExceedsTreatment ?? false,
        planId: props.planId ?? null,
        specialtyId: props.specialtyId ?? null,
        treatments: props.treatments ?? [],
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  static with(props: CommissionRuleProps, id: string): CommissionRule {
    return new CommissionRule(props, id);
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
  get paymentTrigger() {
    return this.props.paymentTrigger;
  }
  get commissionType() {
    return this.props.commissionType;
  }
  get percentageValue() {
    return this.props.percentageValue;
  }
  get commissionValueCents() {
    return this.props.commissionValueCents;
  }
  get allowValueExceedsTreatment() {
    return this.props.allowValueExceedsTreatment;
  }
  get planId() {
    return this.props.planId;
  }
  get specialtyId() {
    return this.props.specialtyId;
  }
  get treatments() {
    return this.props.treatments;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}

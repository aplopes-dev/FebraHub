import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import type {
  CommissionAccrualStatus,
  CommissionPaymentTrigger,
} from '../../../shared/domain/commission-enums';

export type CommissionAccrualProps = {
  storeId: string;
  memberId: string;
  memberName: string;
  ruleId: string | null;
  paymentTrigger: CommissionPaymentTrigger;
  triggerLabel: string;
  planName: string;
  specialtyName: string;
  treatmentName: string;
  patientName: string;
  paidValueCents: number;
  treatmentCostCents: number;
  installment: string | null;
  commissionCents: number;
  accruedAt: Date;
  sourceFinancialEntryId: string | null;
  sourceBudgetId: string | null;
  sourcePatientTreatmentId: string | null;
  status: CommissionAccrualStatus;
  createdAt: Date;
  updatedAt: Date;
};

export class CommissionAccrual extends Entity<CommissionAccrualProps> {
  constructor(props: CommissionAccrualProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // No cross-field invariants beyond what use cases enforce.
  }

  static create(
    props: Optional<
      CommissionAccrualProps,
      | 'ruleId'
      | 'planName'
      | 'specialtyName'
      | 'installment'
      | 'sourceFinancialEntryId'
      | 'sourceBudgetId'
      | 'sourcePatientTreatmentId'
      | 'status'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: string,
  ): CommissionAccrual {
    const now = new Date();
    return new CommissionAccrual(
      {
        storeId: props.storeId,
        memberId: props.memberId,
        memberName: props.memberName,
        ruleId: props.ruleId ?? null,
        paymentTrigger: props.paymentTrigger,
        triggerLabel: props.triggerLabel,
        planName: props.planName ?? '',
        specialtyName: props.specialtyName ?? '',
        treatmentName: props.treatmentName,
        patientName: props.patientName,
        paidValueCents: props.paidValueCents,
        treatmentCostCents: props.treatmentCostCents,
        installment: props.installment ?? null,
        commissionCents: props.commissionCents,
        accruedAt: props.accruedAt,
        sourceFinancialEntryId: props.sourceFinancialEntryId ?? null,
        sourceBudgetId: props.sourceBudgetId ?? null,
        sourcePatientTreatmentId: props.sourcePatientTreatmentId ?? null,
        status: props.status ?? 'open',
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  static with(props: CommissionAccrualProps, id: string): CommissionAccrual {
    return new CommissionAccrual(props, id);
  }

  withPaid(): CommissionAccrual {
    return CommissionAccrual.create(
      { ...this.props, status: 'paid', updatedAt: new Date() },
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
  get ruleId() {
    return this.props.ruleId;
  }
  get paymentTrigger() {
    return this.props.paymentTrigger;
  }
  get triggerLabel() {
    return this.props.triggerLabel;
  }
  get planName() {
    return this.props.planName;
  }
  get specialtyName() {
    return this.props.specialtyName;
  }
  get treatmentName() {
    return this.props.treatmentName;
  }
  get patientName() {
    return this.props.patientName;
  }
  get paidValueCents() {
    return this.props.paidValueCents;
  }
  get treatmentCostCents() {
    return this.props.treatmentCostCents;
  }
  get installment() {
    return this.props.installment;
  }
  get commissionCents() {
    return this.props.commissionCents;
  }
  get accruedAt() {
    return this.props.accruedAt;
  }
  get sourceFinancialEntryId() {
    return this.props.sourceFinancialEntryId;
  }
  get sourceBudgetId() {
    return this.props.sourceBudgetId;
  }
  get sourcePatientTreatmentId() {
    return this.props.sourcePatientTreatmentId;
  }
  get status() {
    return this.props.status;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}

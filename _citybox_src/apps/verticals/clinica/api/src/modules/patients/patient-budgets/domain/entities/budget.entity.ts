import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import { BudgetFrozenError } from '../errors/budget-frozen.error';

export type BudgetStatus = 'pending' | 'approved' | 'rejected' | 'expired';
export type BudgetDiscountType = 'fixed' | 'percent';

export type BudgetProps = {
  storeId: string;
  patientId: string;
  description: string;
  date: Date;
  observations: string;
  responsibleId: string;
  responsibleName: string;
  discountType: BudgetDiscountType | null;
  discountValue: number | null;
  subtotalCents: number;
  finalValueCents: number;
  installmentEnabled: boolean;
  downPaymentCents: number;
  installmentsCount: number;
  status: BudgetStatus;
  supersedesBudgetId: string | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BudgetUpsertInput = {
  description: string;
  date: Date;
  observations: string;
  responsibleId: string;
  responsibleName: string;
  discountType: BudgetDiscountType | null;
  discountValue: number | null;
  subtotalCents: number;
  finalValueCents: number;
  installmentEnabled: boolean;
  downPaymentCents: number;
  installmentsCount: number;
};

export type BudgetStatusChangeMeta = {
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
};

export class Budget extends Entity<BudgetProps> {
  constructor(props: BudgetProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // Pricing and item rules are enforced in use cases.
  }

  static create(
    props: Optional<
      BudgetProps,
      | 'description'
      | 'observations'
      | 'responsibleName'
      | 'discountType'
      | 'discountValue'
      | 'installmentEnabled'
      | 'downPaymentCents'
      | 'installmentsCount'
      | 'status'
      | 'supersedesBudgetId'
      | 'approvedAt'
      | 'rejectedAt'
      | 'rejectionReason'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: string,
  ): Budget {
    return new Budget(
      {
        description: props.description ?? '',
        observations: props.observations ?? '',
        responsibleName: props.responsibleName ?? '',
        discountType: props.discountType ?? null,
        discountValue: props.discountValue ?? null,
        installmentEnabled: props.installmentEnabled ?? false,
        downPaymentCents: props.downPaymentCents ?? 0,
        installmentsCount: props.installmentsCount ?? 0,
        status: props.status ?? 'pending',
        supersedesBudgetId: props.supersedesBudgetId ?? null,
        approvedAt: props.approvedAt ?? null,
        rejectedAt: props.rejectedAt ?? null,
        rejectionReason: props.rejectionReason ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
        storeId: props.storeId,
        patientId: props.patientId,
        date: props.date,
        responsibleId: props.responsibleId,
        subtotalCents: props.subtotalCents,
        finalValueCents: props.finalValueCents,
      },
      id,
    );
  }

  static with(props: BudgetProps, id: string): Budget {
    return new Budget(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get patientId() {
    return this.props.patientId;
  }
  get description() {
    return this.props.description;
  }
  get date() {
    return this.props.date;
  }
  get observations() {
    return this.props.observations;
  }
  get responsibleId() {
    return this.props.responsibleId;
  }
  get responsibleName() {
    return this.props.responsibleName;
  }
  get discountType() {
    return this.props.discountType;
  }
  get discountValue() {
    return this.props.discountValue;
  }
  get subtotalCents() {
    return this.props.subtotalCents;
  }
  get finalValueCents() {
    return this.props.finalValueCents;
  }
  get installmentEnabled() {
    return this.props.installmentEnabled;
  }
  get downPaymentCents() {
    return this.props.downPaymentCents;
  }
  get installmentsCount() {
    return this.props.installmentsCount;
  }
  get status() {
    return this.props.status;
  }
  get supersedesBudgetId() {
    return this.props.supersedesBudgetId;
  }
  get approvedAt() {
    return this.props.approvedAt;
  }
  get rejectedAt() {
    return this.props.rejectedAt;
  }
  get rejectionReason() {
    return this.props.rejectionReason;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  isFrozen(): boolean {
    return this.status === 'approved';
  }

  assertMutable(context: string, budgetId: string): void {
    if (this.isFrozen()) {
      throw new BudgetFrozenError(context, budgetId);
    }
  }

  update(input: BudgetUpsertInput): void {
    this.props.description = input.description;
    this.props.date = input.date;
    this.props.observations = input.observations;
    this.props.responsibleId = input.responsibleId;
    this.props.responsibleName = input.responsibleName;
    this.props.discountType = input.discountType;
    this.props.discountValue = input.discountValue;
    this.props.subtotalCents = input.subtotalCents;
    this.props.finalValueCents = input.finalValueCents;
    this.props.installmentEnabled = input.installmentEnabled;
    this.props.downPaymentCents = input.downPaymentCents;
    this.props.installmentsCount = input.installmentsCount;
    this.touch();
  }

  changeStatus(
    status: BudgetStatus,
    meta?: BudgetStatusChangeMeta,
  ): void {
    if (status === 'approved') {
      this.props.status = 'approved';
      this.props.approvedAt = new Date();
      this.props.rejectedAt = null;
      this.props.rejectionReason = null;
      this.touch();
      return;
    }

    if (status === 'rejected') {
      this.props.status = 'rejected';
      this.props.rejectedAt = meta?.rejectedAt ?? new Date();
      this.props.rejectionReason = meta?.rejectionReason ?? null;
      this.touch();
      return;
    }

    if (status === 'pending') {
      this.props.status = 'pending';
      this.props.rejectedAt = null;
      this.props.rejectionReason = null;
      this.touch();
      return;
    }

    this.props.status = status;
    this.touch();
  }

  touch(): void {
    this.props.updatedAt = new Date();
  }
}

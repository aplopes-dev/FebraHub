import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export type BudgetItemLocationType =
  | 'tooth'
  | 'body_region'
  | 'session'
  | 'none';

export type BudgetItemProps = {
  storeId: string;
  budgetId: string;
  planId: string;
  treatmentId: string;
  professionalId: string;
  professionalName: string;
  planName: string;
  treatmentName: string;
  valueCents: number;
  locationType: BudgetItemLocationType;
  locationLabel: string;
  sessionIndex: number | null;
  sessionTotal: number | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type BudgetItemInput = Omit<
  BudgetItemProps,
  'storeId' | 'budgetId' | 'createdAt' | 'updatedAt'
>;

export class BudgetItem extends Entity<BudgetItemProps> {
  constructor(props: BudgetItemProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // Item reference validation happens in application services.
  }

  static create(
    props: Optional<
      BudgetItemProps,
      | 'professionalName'
      | 'planName'
      | 'treatmentName'
      | 'locationLabel'
      | 'sessionIndex'
      | 'sessionTotal'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: string,
  ): BudgetItem {
    return new BudgetItem(
      {
        professionalName: props.professionalName ?? '',
        planName: props.planName ?? '',
        treatmentName: props.treatmentName ?? '',
        locationLabel: props.locationLabel ?? '',
        sessionIndex: props.sessionIndex ?? null,
        sessionTotal: props.sessionTotal ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
        storeId: props.storeId,
        budgetId: props.budgetId,
        planId: props.planId,
        treatmentId: props.treatmentId,
        professionalId: props.professionalId,
        valueCents: props.valueCents,
        locationType: props.locationType,
        sortOrder: props.sortOrder,
      },
      id,
    );
  }

  static with(props: BudgetItemProps, id: string): BudgetItem {
    return new BudgetItem(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get budgetId() {
    return this.props.budgetId;
  }
  get planId() {
    return this.props.planId;
  }
  get treatmentId() {
    return this.props.treatmentId;
  }
  get professionalId() {
    return this.props.professionalId;
  }
  get professionalName() {
    return this.props.professionalName;
  }
  get planName() {
    return this.props.planName;
  }
  get treatmentName() {
    return this.props.treatmentName;
  }
  get valueCents() {
    return this.props.valueCents;
  }
  get locationType() {
    return this.props.locationType;
  }
  get locationLabel() {
    return this.props.locationLabel;
  }
  get sessionIndex() {
    return this.props.sessionIndex;
  }
  get sessionTotal() {
    return this.props.sessionTotal;
  }
  get sortOrder() {
    return this.props.sortOrder;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}

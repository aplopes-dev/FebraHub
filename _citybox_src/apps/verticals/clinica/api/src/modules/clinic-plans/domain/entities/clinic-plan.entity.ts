import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { ClinicPlanValidatorFactory } from '../factories/clinic-plan-validator.factory';

export type ClinicPlanStatus = 'active' | 'inactive';
export type ClinicPlanTreatmentInit = 'copy_default' | 'empty';

export type ClinicPlanProps = {
  storeId: string;
  name: string;
  sortOrder: number;
  status: ClinicPlanStatus;
  isDefault: boolean;
  treatmentInit: ClinicPlanTreatmentInit | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateClinicPlanInput = {
  name: string;
  status: ClinicPlanStatus;
  isDefault: boolean;
};

export class ClinicPlan extends Entity<ClinicPlanProps> {
  constructor(props: ClinicPlanProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    ClinicPlanValidatorFactory.create().validate(this);
  }

  static create(
    props: Optional<
      ClinicPlanProps,
      'status' | 'isDefault' | 'treatmentInit' | 'createdAt' | 'updatedAt'
    >,
    id?: string,
  ): ClinicPlan {
    return new ClinicPlan(
      {
        ...props,
        status: props.status ?? 'active',
        isDefault: props.isDefault ?? false,
        treatmentInit: props.treatmentInit ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  static with(props: ClinicPlanProps, id: string): ClinicPlan {
    return new ClinicPlan(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get name() {
    return this.props.name;
  }
  get sortOrder() {
    return this.props.sortOrder;
  }
  get status() {
    return this.props.status;
  }
  get isDefault() {
    return this.props.isDefault;
  }
  get treatmentInit() {
    return this.props.treatmentInit;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  markAsDefault(): void {
    this.props.isDefault = true;
    this.props.status = 'active';
    this.touch();
    this.validate();
  }

  clearDefault(): void {
    this.props.isDefault = false;
    this.touch();
    this.validate();
  }

  changeStatus(active: boolean): void {
    this.props.status = active ? 'active' : 'inactive';
    if (!active) {
      this.props.isDefault = false;
    }
    this.touch();
    this.validate();
  }

  update(input: UpdateClinicPlanInput): void {
    this.props.name = input.name.trim();
    if (input.isDefault) {
      this.markAsDefault();
      return;
    }
    this.props.isDefault = false;
    this.props.status = input.status;
    this.touch();
    this.validate();
  }

  touch(): void {
    this.props.updatedAt = new Date();
  }
}

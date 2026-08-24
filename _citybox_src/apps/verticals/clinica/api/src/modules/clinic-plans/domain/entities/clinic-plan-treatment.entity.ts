import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { ClinicPlanTreatmentValidatorFactory } from '../factories/clinic-plan-treatment-validator.factory';
import type { ClinicPlanLocationUiType } from '../types/clinic-plan-location-ui-type';

export type ClinicPlanTreatmentProps = {
  storeId: string;
  planId: string;
  specialtyId: string;
  name: string;
  valueCents: number;
  costCents: number;
  enabled: boolean;
  acceptsFaces: boolean;
  locationUiType: ClinicPlanLocationUiType | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export class ClinicPlanTreatment extends Entity<ClinicPlanTreatmentProps> {
  constructor(props: ClinicPlanTreatmentProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    ClinicPlanTreatmentValidatorFactory.create().validate(this);
  }

  static create(
    props: Optional<
      ClinicPlanTreatmentProps,
      'createdAt' | 'updatedAt' | 'acceptsFaces' | 'locationUiType'
    >,
    id?: string,
  ): ClinicPlanTreatment {
    return new ClinicPlanTreatment(
      {
        ...props,
        acceptsFaces: props.acceptsFaces ?? false,
        locationUiType: props.locationUiType ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  static with(
    props: ClinicPlanTreatmentProps,
    id: string,
  ): ClinicPlanTreatment {
    return new ClinicPlanTreatment(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get planId() {
    return this.props.planId;
  }
  get specialtyId() {
    return this.props.specialtyId;
  }
  get name() {
    return this.props.name;
  }
  get valueCents() {
    return this.props.valueCents;
  }
  get costCents() {
    return this.props.costCents;
  }
  get enabled() {
    return this.props.enabled;
  }
  get acceptsFaces() {
    return this.props.acceptsFaces;
  }
  get locationUiType() {
    return this.props.locationUiType;
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

  update(input: {
    name: string;
    valueCents: number;
    costCents: number;
    enabled: boolean;
    acceptsFaces: boolean;
    locationUiType: ClinicPlanLocationUiType | null;
    sortOrder: number;
  }): void {
    this.props.name = input.name;
    this.props.valueCents = input.valueCents;
    this.props.costCents = input.costCents;
    this.props.enabled = input.enabled;
    this.props.acceptsFaces = input.acceptsFaces;
    this.props.locationUiType = input.locationUiType;
    this.props.sortOrder = input.sortOrder;
    this.touch();
    this.validate();
  }

  touch(): void {
    this.props.updatedAt = new Date();
  }
}

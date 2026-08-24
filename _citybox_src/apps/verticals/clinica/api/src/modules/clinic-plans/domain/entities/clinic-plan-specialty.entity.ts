import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { ClinicPlanSpecialtyValidatorFactory } from '../factories/clinic-plan-specialty-validator.factory';
import type { ClinicPlanLocationUiType } from '../types/clinic-plan-location-ui-type';

export type ClinicPlanSpecialtyProps = {
  storeId: string;
  planId: string;
  name: string;
  locationUiType: ClinicPlanLocationUiType;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export class ClinicPlanSpecialty extends Entity<ClinicPlanSpecialtyProps> {
  constructor(props: ClinicPlanSpecialtyProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    ClinicPlanSpecialtyValidatorFactory.create().validate(this);
  }

  static create(
    props: Optional<
      ClinicPlanSpecialtyProps,
      'createdAt' | 'updatedAt' | 'locationUiType'
    >,
    id?: string,
  ): ClinicPlanSpecialty {
    return new ClinicPlanSpecialty(
      {
        ...props,
        locationUiType: props.locationUiType ?? 'tooth',
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  static with(
    props: ClinicPlanSpecialtyProps,
    id: string,
  ): ClinicPlanSpecialty {
    return new ClinicPlanSpecialty(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get planId() {
    return this.props.planId;
  }
  get name() {
    return this.props.name;
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

  rename(name: string): void {
    this.props.name = name;
    this.touch();
    this.validate();
  }

  setLocationUiType(locationUiType: ClinicPlanLocationUiType): void {
    this.props.locationUiType = locationUiType;
    this.touch();
    this.validate();
  }

  setSortOrder(sortOrder: number): void {
    this.props.sortOrder = sortOrder;
    this.touch();
  }

  touch(): void {
    this.props.updatedAt = new Date();
  }
}

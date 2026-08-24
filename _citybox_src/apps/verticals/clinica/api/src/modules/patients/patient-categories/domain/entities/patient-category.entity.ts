import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';
import { PatientCategoryValidatorFactory } from '../factories/patient-category-validator.factory';

export type PatientCategoryProps = {
  storeId: string;
  name: string;
  /** Hex `#rrggbb`. */
  colorId: string;
  isProtected: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdatePatientCategoryInput = {
  name: string;
  colorId: string;
};

export class PatientCategory extends Entity<PatientCategoryProps> {
  constructor(props: PatientCategoryProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    PatientCategoryValidatorFactory.create().validate(this);
  }

  public static create(
    props: Optional<
      PatientCategoryProps,
      'isProtected' | 'createdAt' | 'updatedAt'
    >,
    id?: string,
  ): PatientCategory {
    return new PatientCategory(
      {
        ...props,
        colorId: props.colorId.trim().toLowerCase(),
        isProtected: props.isProtected ?? false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: PatientCategoryProps, id: string): PatientCategory {
    return new PatientCategory(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get name() {
    return this.props.name;
  }
  get colorId() {
    return this.props.colorId;
  }
  get isProtected() {
    return this.props.isProtected;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  public touch(): void {
    this.props.updatedAt = new Date();
  }

  public update(input: UpdatePatientCategoryInput): void {
    this.props.name = input.name;
    this.props.colorId = input.colorId.trim().toLowerCase();
    this.touch();
    this.validate();
  }
}

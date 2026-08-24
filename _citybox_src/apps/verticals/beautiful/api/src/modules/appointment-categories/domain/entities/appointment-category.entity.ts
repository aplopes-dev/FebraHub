import { Entity } from '../../../../shared/core/entity';
import { DEFAULT_CATEGORY_HEX } from '../../../../shared/core/utils/category-hex';
import { AppointmentCategoryValidatorFactory } from '../factories/appointment-category-validator.factory';

export interface AppointmentCategoryProps {
  storeId: string;
  name: string;
  /** Hex `#rrggbb`. */
  color: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AppointmentCategoryEntity extends Entity<AppointmentCategoryProps> {
  private constructor(props: AppointmentCategoryProps, id?: string) {
    super(
      {
        ...props,
        color: (props.color ?? DEFAULT_CATEGORY_HEX).toLowerCase(),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    this.validate();
  }

  protected validate(): void {
    AppointmentCategoryValidatorFactory.create().validate(this.props);
  }

  public static create(
    props: Omit<AppointmentCategoryProps, 'createdAt' | 'updatedAt'> & {
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: string,
  ): AppointmentCategoryEntity {
    return new AppointmentCategoryEntity(
      {
        ...props,
        color: props.color ?? DEFAULT_CATEGORY_HEX,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get name(): string {
    return this.props.name;
  }

  get color(): string {
    return this.props.color;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  public update(data: { name?: string; color?: string }): void {
    if (data.name !== undefined) this.props.name = data.name;
    if (data.color !== undefined) this.props.color = data.color.toLowerCase();
    this.props.updatedAt = new Date();
    this.validate();
  }
}

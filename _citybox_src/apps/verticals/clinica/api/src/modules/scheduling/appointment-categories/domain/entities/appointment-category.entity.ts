import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export type AppointmentCategoryProps = {
  storeId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateAppointmentCategoryInput = {
  name: string;
  color: string;
};

export class AppointmentCategory extends Entity<AppointmentCategoryProps> {
  constructor(props: AppointmentCategoryProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {}

  public static create(
    props: Optional<AppointmentCategoryProps, 'createdAt' | 'updatedAt'>,
    id?: string,
  ): AppointmentCategory {
    return new AppointmentCategory(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(
    props: AppointmentCategoryProps,
    id: string,
  ): AppointmentCategory {
    return new AppointmentCategory(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get name() {
    return this.props.name;
  }
  get color() {
    return this.props.color;
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

  public update(input: UpdateAppointmentCategoryInput): void {
    this.props.name = input.name.trim();
    this.props.color = input.color.trim();
    this.touch();
  }
}

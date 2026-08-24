import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

import { SalesLabelZodValidator } from '../validators/sales-label.zod.validator';

export type SalesLabelProps = {
  storeId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
};

export class SalesLabel extends Entity<SalesLabelProps> {
  constructor(props: SalesLabelProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    SalesLabelZodValidator.create().validate(this);
  }

  public static create(
    props: Optional<SalesLabelProps, 'createdAt' | 'updatedAt'>,
    id?: string,
  ): SalesLabel {
    return new SalesLabel(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: SalesLabelProps, id: string): SalesLabel {
    return new SalesLabel(props, id);
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

  public withUpdate(input: { name?: string; color?: string }): SalesLabel {
    return SalesLabel.create(
      {
        storeId: this.storeId,
        name: input.name ?? this.name,
        color: input.color ?? this.color,
        createdAt: this.createdAt,
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}

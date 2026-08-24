import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';

import { StockSupplierZodValidator } from '../validators/stock-supplier.zod.validator';

export type StockSupplierProps = {
  storeId: string;
  name: string;
  phone: string | null;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class StockSupplier extends Entity<StockSupplierProps> {
  constructor(props: StockSupplierProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    StockSupplierZodValidator.create().validate(this);
  }

  public static create(
    props: Optional<StockSupplierProps, 'createdAt' | 'updatedAt'>,
    id?: string,
  ): StockSupplier {
    return new StockSupplier(
      {
        ...props,
        phone: props.phone ?? null,
        email: props.email ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: StockSupplierProps, id: string): StockSupplier {
    return new StockSupplier(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }

  get name() {
    return this.props.name;
  }

  get phone() {
    return this.props.phone;
  }

  get email() {
    return this.props.email;
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

  public update(input: {
    name: string;
    phone: string | null;
    email: string | null;
  }): void {
    this.props.name = input.name;
    this.props.phone = input.phone;
    this.props.email = input.email;
    this.touch();
    this.validate();
  }
}

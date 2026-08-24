import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export type CustomerCategoryProps = {
  organizationId: string;
  name: string;
  discountPercentage: number;
  createdAt: Date;
  updatedAt: Date;
};

type CreateCustomerCategoryProps = Optional<
  CustomerCategoryProps,
  'discountPercentage' | 'createdAt' | 'updatedAt'
>;

export class CustomerCategory extends Entity<CustomerCategoryProps> {
  constructor(props: CustomerCategoryProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Validação de formato no DTO HTTP; domínio guarda só invariantes simples.
  }

  public static create(
    props: CreateCustomerCategoryProps,
    id?: string,
  ): CustomerCategory {
    return new CustomerCategory(
      {
        organizationId: props.organizationId,
        name: props.name.trim(),
        discountPercentage: props.discountPercentage ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(
    props: CustomerCategoryProps,
    id: string,
  ): CustomerCategory {
    return new CustomerCategory(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get name() {
    return this.props.name;
  }
  get discountPercentage() {
    return this.props.discountPercentage;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  update(input: {
    name: string;
    discountPercentage: number;
  }): CustomerCategory {
    return CustomerCategory.with(
      {
        ...this.props,
        name: input.name.trim(),
        discountPercentage: input.discountPercentage,
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}

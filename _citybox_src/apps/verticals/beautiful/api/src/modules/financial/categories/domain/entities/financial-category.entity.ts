import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export type FinancialCategoryKind = 'income' | 'expense';

export type FinancialCategoryProps = {
  storeId: string;
  kind: FinancialCategoryKind;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
};

export class FinancialCategory extends Entity<FinancialCategoryProps> {
  constructor(props: FinancialCategoryProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // Rules enforced in use cases.
  }

  static create(
    props: Optional<
      FinancialCategoryProps,
      'color' | 'createdAt' | 'updatedAt'
    >,
    id?: string,
  ): FinancialCategory {
    const now = new Date();
    return new FinancialCategory(
      {
        storeId: props.storeId,
        kind: props.kind,
        name: props.name,
        color: props.color ?? '',
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  static with(props: FinancialCategoryProps, id: string): FinancialCategory {
    return new FinancialCategory(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get kind() {
    return this.props.kind;
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

  withUpdate(input: { name?: string; color?: string }): FinancialCategory {
    return FinancialCategory.create(
      {
        ...this.props,
        name: input.name ?? this.props.name,
        color: input.color ?? this.props.color,
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}

import { Entity } from '../../../../../shared/core/entity';
import type { Optional } from '../../../../../shared/core/types/optional.type';

export type FinancialAccountProps = {
  storeId: string;
  name: string;
  type: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class FinancialAccount extends Entity<FinancialAccountProps> {
  constructor(props: FinancialAccountProps, id?: string) {
    super(props, id);
  }

  protected validate(): void {
    // Rules enforced in use cases.
  }

  static create(
    props: Optional<
      FinancialAccountProps,
      'type' | 'isActive' | 'createdAt' | 'updatedAt'
    >,
    id?: string,
  ): FinancialAccount {
    const now = new Date();
    return new FinancialAccount(
      {
        storeId: props.storeId,
        name: props.name,
        type: props.type ?? 'checking',
        isActive: props.isActive ?? true,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }

  static with(props: FinancialAccountProps, id: string): FinancialAccount {
    return new FinancialAccount(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get name() {
    return this.props.name;
  }
  get type() {
    return this.props.type;
  }
  get isActive() {
    return this.props.isActive;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  withUpdate(input: {
    name?: string;
    type?: string;
    isActive?: boolean;
  }): FinancialAccount {
    return FinancialAccount.create(
      {
        ...this.props,
        name: input.name ?? this.props.name,
        type: input.type ?? this.props.type,
        isActive: input.isActive ?? this.props.isActive,
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}

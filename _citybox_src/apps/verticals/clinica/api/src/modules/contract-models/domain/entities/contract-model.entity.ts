import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { ContractModelValidatorFactory } from '../factories/contract-model-validator.factory';

export type ContractModelProps = {
  storeId: string;
  name: string;
  content: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateContractModelInput = {
  name: string;
  content: string;
  isDefault: boolean;
};

export class ContractModel extends Entity<ContractModelProps> {
  constructor(props: ContractModelProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    ContractModelValidatorFactory.create().validate(this);
  }

  public static create(
    props: Optional<
      ContractModelProps,
      'content' | 'isDefault' | 'createdAt' | 'updatedAt'
    >,
    id?: string,
  ): ContractModel {
    return new ContractModel(
      {
        ...props,
        content: props.content ?? '',
        isDefault: props.isDefault ?? false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: ContractModelProps, id: string): ContractModel {
    return new ContractModel(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }
  get name() {
    return this.props.name;
  }
  get content() {
    return this.props.content;
  }
  get isDefault() {
    return this.props.isDefault;
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

  public update(input: UpdateContractModelInput): void {
    Object.assign(this.props, {
      name: input.name,
      content: input.content,
      isDefault: input.isDefault,
    });
    this.touch();
    this.validate();
  }
}

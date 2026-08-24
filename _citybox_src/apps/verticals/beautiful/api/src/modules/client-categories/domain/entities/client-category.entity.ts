import { Entity } from '../../../../shared/core/entity';
import { DEFAULT_CATEGORY_HEX } from '../../../../shared/core/utils/category-hex';
import { ClientCategoryValidatorFactory } from '../factories/client-category-validator.factory';

export interface ClientCategoryProps {
  storeId: string;
  name: string;
  /** Hex `#rrggbb`. */
  colorId: string;
  isProtected: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ClientCategoryEntity extends Entity<ClientCategoryProps> {
  private constructor(props: ClientCategoryProps, id?: string) {
    super(
      {
        ...props,
        colorId: (props.colorId ?? DEFAULT_CATEGORY_HEX).toLowerCase(),
        isProtected: props.isProtected ?? false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    this.validate();
  }

  protected validate(): void {
    ClientCategoryValidatorFactory.create().validate(this.props);
  }

  public static create(
    props: Omit<
      ClientCategoryProps,
      'isProtected' | 'createdAt' | 'updatedAt'
    > & {
      isProtected?: boolean;
      createdAt?: Date;
      updatedAt?: Date;
    },
    id?: string,
  ): ClientCategoryEntity {
    return new ClientCategoryEntity(
      {
        ...props,
        isProtected: props.isProtected ?? false,
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

  get colorId(): string {
    return this.props.colorId;
  }

  get isProtected(): boolean {
    return this.props.isProtected;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  public update(data: { name?: string; colorId?: string }): void {
    if (data.name !== undefined) this.props.name = data.name;
    if (data.colorId !== undefined)
      this.props.colorId = data.colorId.toLowerCase();
    this.props.updatedAt = new Date();
    this.validate();
  }
}

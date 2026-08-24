import { Entity } from '../../../../shared/core/entity';
import { ClientValidatorFactory } from '../factories/client-validator.factory';

export interface ClientProps {
  storeId: string;
  name: string;
  phone: string;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryColorId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ClientEntity extends Entity<ClientProps> {
  private constructor(props: ClientProps, id?: string) {
    super(
      {
        ...props,
        categoryId: props.categoryId ?? null,
        categoryName: props.categoryName ?? null,
        categoryColorId: props.categoryColorId ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    this.validate();
  }

  protected validate(): void {
    ClientValidatorFactory.create().validate(this.props);
  }

  public static create(props: ClientProps, id?: string): ClientEntity {
    return new ClientEntity(props, id);
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get name(): string {
    return this.props.name;
  }

  get phone(): string {
    return this.props.phone;
  }

  get categoryId(): string | null {
    return this.props.categoryId ?? null;
  }

  get categoryName(): string | null {
    return this.props.categoryName ?? null;
  }

  get categoryColorId(): string | null {
    return this.props.categoryColorId ?? null;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  public update(
    data: Partial<
      Omit<
        ClientProps,
        | 'storeId'
        | 'createdAt'
        | 'updatedAt'
        | 'categoryName'
        | 'categoryColorId'
      >
    >,
  ): void {
    if (data.name !== undefined) this.props.name = data.name;
    if (data.phone !== undefined) this.props.phone = data.phone;
    if (data.categoryId !== undefined) {
      this.props.categoryId = data.categoryId;
      if (data.categoryId === null) {
        this.props.categoryName = null;
        this.props.categoryColorId = null;
      }
    }
    this.props.updatedAt = new Date();
    this.validate();
  }

  public setCategoryName(name: string | null): void {
    this.props.categoryName = name;
  }

  public setCategoryColorId(colorId: string | null): void {
    this.props.categoryColorId = colorId;
  }
}

import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { ProductAddonValidatorFactory } from '../factories/product-addon-validator.factory';

export type ProductAddonProps = {
  organizationId: string;
  name: string;
  defaultPriceCents: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateProductAddonProps = Optional<
  ProductAddonProps,
  'defaultPriceCents' | 'deletedAt' | 'createdAt' | 'updatedAt'
>;

export class ProductAddon extends Entity<ProductAddonProps> {
  constructor(props: ProductAddonProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    ProductAddonValidatorFactory.create().validate(this);
  }

  public static create(
    props: CreateProductAddonProps,
    id?: string,
  ): ProductAddon {
    return new ProductAddon(
      {
        ...props,
        defaultPriceCents: props.defaultPriceCents ?? 0,
        deletedAt: props.deletedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: ProductAddonProps, id: string): ProductAddon {
    return new ProductAddon(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get name() {
    return this.props.name;
  }
  get defaultPriceCents() {
    return this.props.defaultPriceCents;
  }
  get deletedAt() {
    return this.props.deletedAt;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  public isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }

  public update(input: {
    name: string;
    defaultPriceCents: number;
  }): ProductAddon {
    return ProductAddon.with(
      {
        ...this.props,
        name: input.name.trim(),
        defaultPriceCents: input.defaultPriceCents,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /** Soft-delete (FR-004): some da listagem de ativos, vínculos existentes seguem legíveis. */
  public softDelete(at: Date = new Date()): ProductAddon {
    if (this.props.deletedAt !== null) return this;
    return ProductAddon.with(
      { ...this.props, deletedAt: at, updatedAt: at },
      this.id,
    );
  }
}

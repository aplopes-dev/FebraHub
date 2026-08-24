import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';

export type ProductCategoryProps = {
  organizationId: string;
  name: string;
  active: boolean;
  systemKey: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type CreateProductCategoryProps = Optional<
  ProductCategoryProps,
  'active' | 'systemKey' | 'isSystem' | 'createdAt' | 'updatedAt'
>;

export class ProductCategory extends Entity<ProductCategoryProps> {
  constructor(props: ProductCategoryProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Categoria é um cadastro de apoio (nome + ativo) — a validação de formato
    // fica no DTO HTTP. Sem regra de domínio própria por ora.
  }

  public static create(
    props: CreateProductCategoryProps,
    id?: string,
  ): ProductCategory {
    return new ProductCategory(
      {
        ...props,
        active: props.active ?? true,
        systemKey: props.systemKey ?? null,
        isSystem: props.isSystem ?? false,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: ProductCategoryProps, id: string): ProductCategory {
    return new ProductCategory(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get name() {
    return this.props.name;
  }
  get active() {
    return this.props.active;
  }
  get systemKey() {
    return this.props.systemKey;
  }
  get isSystem() {
    return this.props.isSystem;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  update(input: { name: string; active: boolean }): ProductCategory {
    return ProductCategory.with(
      {
        ...this.props,
        name: input.name.trim(),
        active: input.active,
        updatedAt: new Date(),
      },
      this.id,
    );
  }
}

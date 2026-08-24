import { Entity } from '../../../../shared/core/entity';
import { ProductValidatorFactory } from '../factories/product-validator.factory';

export interface ProductProps {
  storeId: string;
  name: string;
  sku?: string | null;
  unitOfMeasure: string;
  stockQuantity: number;
  minStockQuantity: number;
  costPrice?: number | null;
  description?: string | null;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ProductEntity extends Entity<ProductProps> {
  private constructor(props: ProductProps, id?: string) {
    const trimmedSku = props.sku && props.sku.trim().length > 0 ? props.sku.trim() : null;
    super(
      {
        ...props,
        sku: trimmedSku,
        stockQuantity: props.stockQuantity ?? 0,
        minStockQuantity: props.minStockQuantity ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    this.validate();
  }

  protected validate(): void {
    ProductValidatorFactory.create().validate(this.props);
  }

  public static create(props: ProductProps, id?: string): ProductEntity {
    return new ProductEntity(props, id);
  }

  get storeId(): string {
    return this.props.storeId;
  }

  get name(): string {
    return this.props.name;
  }

  get sku(): string {
    return this.props.sku ?? '';
  }

  get unitOfMeasure(): string {
    return this.props.unitOfMeasure;
  }

  get stockQuantity(): number {
    return this.props.stockQuantity;
  }

  get minStockQuantity(): number {
    return this.props.minStockQuantity;
  }

  get costPrice(): number | null | undefined {
    return this.props.costPrice;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get active(): boolean {
    return this.props.active;
  }

  get createdAt(): Date {
    return this.props.createdAt!;
  }

  get updatedAt(): Date {
    return this.props.updatedAt!;
  }

  public update(
    data: Partial<Omit<ProductProps, 'storeId' | 'createdAt' | 'updatedAt'>>,
  ): void {
    if (data.name !== undefined) this.props.name = data.name;
    if (data.sku !== undefined) this.props.sku = data.sku;
    if (data.unitOfMeasure !== undefined)
      this.props.unitOfMeasure = data.unitOfMeasure;
    if (data.stockQuantity !== undefined)
      this.props.stockQuantity = data.stockQuantity;
    if (data.minStockQuantity !== undefined)
      this.props.minStockQuantity = data.minStockQuantity;
    if (data.costPrice !== undefined) this.props.costPrice = data.costPrice;
    if (data.description !== undefined)
      this.props.description = data.description;
    if (data.active !== undefined) this.props.active = data.active;
    this.props.updatedAt = new Date();
    this.validate();
  }

  public toggleActive(): void {
    this.props.active = !this.props.active;
    this.props.updatedAt = new Date();
  }

  /** Ajusta estoque por delta (positivo = entrada, negativo = saída). */
  public adjustStock(delta: number): void {
    const next = this.props.stockQuantity + delta;
    if (next < 0) {
      throw new Error('NEGATIVE_STOCK');
    }
    this.props.stockQuantity = next;
    this.props.updatedAt = new Date();
    this.validate();
  }
}

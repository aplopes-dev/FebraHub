import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';

import type { StockStatus } from '../stock-types';
import { calculateStockStatus } from '../utils/stock-status.utils';

import { StockProductZodValidator } from '../validators/stock-product.zod.validator';

export type StockProductProps = {
  storeId: string;
  name: string;
  category: string;
  sku: string | null;
  supplierId: string | null;
  quantity: number;
  minQuantity: number;
  unitCostCents: number;
  photoObjectKey: string | null;
  photoMimeType: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class StockProduct extends Entity<StockProductProps> {
  constructor(props: StockProductProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    StockProductZodValidator.create().validate(this);
  }

  public static create(
    props: Optional<
      StockProductProps,
      | 'sku'
      | 'supplierId'
      | 'photoObjectKey'
      | 'photoMimeType'
      | 'createdAt'
      | 'updatedAt'
    >,
    id?: string,
  ): StockProduct {
    return new StockProduct(
      {
        ...props,
        sku: props.sku ?? null,
        supplierId: props.supplierId ?? null,
        photoObjectKey: props.photoObjectKey ?? null,
        photoMimeType: props.photoMimeType ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: StockProductProps, id: string): StockProduct {
    return new StockProduct(props, id);
  }

  get storeId() {
    return this.props.storeId;
  }

  get name() {
    return this.props.name;
  }

  get category() {
    return this.props.category;
  }

  get sku() {
    return this.props.sku;
  }

  get supplierId() {
    return this.props.supplierId;
  }

  get quantity() {
    return this.props.quantity;
  }

  get minQuantity() {
    return this.props.minQuantity;
  }

  get unitCostCents() {
    return this.props.unitCostCents;
  }

  get photoObjectKey() {
    return this.props.photoObjectKey;
  }

  get photoMimeType() {
    return this.props.photoMimeType;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  public get status(): StockStatus {
    return calculateStockStatus(this.props.quantity, this.props.minQuantity);
  }

  public touch(): void {
    this.props.updatedAt = new Date();
  }

  public updateForEdit(input: {
    name: string;
    category: string;
    sku: string | null;
    supplierId: string | null;
    minQuantity: number;
    unitCostCents: number;
    photoObjectKey: string | null;
    photoMimeType: string | null;
  }): void {
    this.props.name = input.name;
    this.props.category = input.category;
    this.props.sku = input.sku;
    this.props.supplierId = input.supplierId;
    this.props.minQuantity = input.minQuantity;
    this.props.unitCostCents = input.unitCostCents;
    this.props.photoObjectKey = input.photoObjectKey;
    this.props.photoMimeType = input.photoMimeType;
    this.touch();
    this.validate();
  }

  public applyEntry(quantityDelta: number): void {
    this.props.quantity += quantityDelta;
    this.touch();
    this.validate();
  }

  public applyWithdrawal(quantityDelta: number): void {
    const next = this.props.quantity - quantityDelta;
    this.props.quantity = Math.max(0, next);
    this.touch();
    this.validate();
  }

  public setPhoto(objectKey: string, mimeType: string): void {
    this.props.photoObjectKey = objectKey;
    this.props.photoMimeType = mimeType;
    this.touch();
    this.validate();
  }

  public clearPhoto(): void {
    this.props.photoObjectKey = null;
    this.props.photoMimeType = null;
    this.touch();
    this.validate();
  }
}

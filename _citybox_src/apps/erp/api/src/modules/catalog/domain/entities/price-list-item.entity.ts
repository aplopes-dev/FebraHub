import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';

export type PriceListItemProps = {
  organizationId: string;
  priceListId: string;
  productId: string;
  priceCents: number;
  createdAt: Date;
  updatedAt: Date;
};

type CreatePriceListItemProps = Optional<
  PriceListItemProps,
  'createdAt' | 'updatedAt'
>;

export class PriceListItem extends Entity<PriceListItemProps> {
  constructor(props: PriceListItemProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Validação de preço >= 0 e produto no use case / DTO HTTP.
  }

  public static create(
    props: CreatePriceListItemProps,
    id?: string,
  ): PriceListItem {
    return new PriceListItem(
      {
        ...props,
        priceCents: Math.max(0, Math.round(props.priceCents)),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: PriceListItemProps, id: string): PriceListItem {
    return new PriceListItem(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get priceListId() {
    return this.props.priceListId;
  }
  get productId() {
    return this.props.productId;
  }
  get priceCents() {
    return this.props.priceCents;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }
}

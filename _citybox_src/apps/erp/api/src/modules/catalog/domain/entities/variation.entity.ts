import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';

export const VARIATION_PRICE_METHODS = ['sum', 'average', 'highest'] as const;
export type VariationPriceMethod = (typeof VARIATION_PRICE_METHODS)[number];

export type VariationOptionProps = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  priceCents: number;
  code: string;
  sortOrder: number;
};

export type VariationCalculationProps = {
  chooseFrom: number;
  chooseTo: number;
  chargeFromSelectedQuantity: boolean;
  chargeFromQuantity: number;
  priceMethod: VariationPriceMethod;
};

export type VariationProps = {
  organizationId: string;
  name: string;
  calculation: VariationCalculationProps;
  options: VariationOptionProps[];
  /** Nomes de produtos vinculados (derivado na listagem). */
  productNames: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type VariationOptionInput = {
  id?: string;
  name: string;
  description?: string;
  imageUrl?: string | null;
  priceCents?: number;
  code?: string;
  sortOrder?: number;
};

type CreateVariationProps = Optional<
  VariationProps,
  'productNames' | 'createdAt' | 'updatedAt'
>;

export class Variation extends Entity<VariationProps> {
  constructor(props: VariationProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    // Formato validado no DTO HTTP / use case.
  }

  public static create(props: CreateVariationProps, id?: string): Variation {
    return new Variation(
      {
        ...props,
        productNames: props.productNames ?? [],
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: VariationProps, id: string): Variation {
    return new Variation(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get name() {
    return this.props.name;
  }
  get calculation() {
    return this.props.calculation;
  }
  get options() {
    return this.props.options;
  }
  get productNames() {
    return this.props.productNames;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  /** Nome exibido na coluna "Produto" da listagem. */
  get productName(): string {
    if (this.props.productNames.length === 0) return '—';
    if (this.props.productNames.length === 1) {
      return this.props.productNames[0] ?? '—';
    }
    return `${this.props.productNames[0]} (+${this.props.productNames.length - 1})`;
  }

  public update(input: {
    name: string;
    calculation: VariationCalculationProps;
    options: VariationOptionProps[];
  }): Variation {
    return Variation.with(
      {
        ...this.props,
        name: input.name,
        calculation: input.calculation,
        options: input.options,
        updatedAt: new Date(),
      },
      this.id,
    );
  }

  /** Atualiza a object key MinIO de uma opção (imutável). */
  public withOptionImage(
    optionId: string,
    imageUrl: string | null,
  ): Variation {
    const options = this.props.options.map((option) =>
      option.id === optionId ? { ...option, imageUrl } : option,
    );
    return Variation.with(
      { ...this.props, options, updatedAt: new Date() },
      this.id,
    );
  }

  public findOption(optionId: string): VariationOptionProps | null {
    return this.props.options.find((option) => option.id === optionId) ?? null;
  }
}

export function normalizeVariationOptions(
  options: VariationOptionInput[],
): VariationOptionProps[] {
  return options.map((option, index) => ({
    id: option.id?.trim() || crypto.randomUUID(),
    name: option.name.trim(),
    description: (option.description ?? '').trim(),
    imageUrl: option.imageUrl ?? null,
    priceCents: Math.max(0, Math.trunc(option.priceCents ?? 0)),
    code: (option.code ?? '').trim(),
    sortOrder: option.sortOrder ?? index,
  }));
}

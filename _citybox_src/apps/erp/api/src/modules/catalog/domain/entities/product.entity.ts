import { Entity } from '../../../../shared/core/entity';
import type { Optional } from '../../../../shared/core/types/optional.type';
import { ProductValidatorFactory } from '../factories/product-validator.factory';

export const PRODUCT_TYPES = ['simple', 'collection', 'supply'] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_VARIATION_FORMATS = ['grid', 'composite'] as const;

export type ProductVariationFormat = (typeof PRODUCT_VARIATION_FORMATS)[number];

/** De quem se compra o item, e como o pedido é feito ao fornecedor. */
export type ProductSupplierLink = {
  supplierId: string;
  /** Código do produto no catálogo do fornecedor. */
  supplierCode: string | null;
  /** Quantas unidades nossas vêm em uma unidade de compra dele. */
  conversion: number;
};

/** Override opcional de preço/código de uma opção no produto. */
export type ProductVariationOptionOverride = {
  optionId: string;
  priceCents: number | null;
  barcode: string | null;
};

/** Vínculo produto ↔ variação do catálogo. */
export type ProductVariationLink = {
  variationId: string;
  optionIds: string[];
  minChoices: number;
  maxChoices: number;
  optionOverrides: ProductVariationOptionOverride[];
  sortOrder: number;
};

/** Configuração de adicionais do produto (1:1). Ausência = defaults do form. */
export type ProductAddonSettingsProps = {
  minQuantity: number;
  maxQuantity: number;
  chargeFromSelectedQuantity: boolean;
  chargeFromQuantity: number;
};

/** Linha de adicional vinculada ao produto (produto ↔ catálogo de adicionais). */
export type ProductAddonLineLink = {
  addonId: string;
  maxQuantity: number;
  priceCents: number;
  sortOrder: number;
};

/** Linha de sugestão (cross-sell) vinculada ao produto. */
export type ProductSuggestionLink = {
  suggestedProductId: string;
  sortOrder: number;
};

const DEFAULT_ADDON_SETTINGS: ProductAddonSettingsProps = {
  minQuantity: 0,
  maxQuantity: 0,
  chargeFromSelectedQuantity: false,
  chargeFromQuantity: 1,
};

export type ProductProps = {
  organizationId: string;
  name: string;
  sku: string;
  categoryId: string;
  unitOfMeasureId: string | null;
  type: ProductType;
  basePriceCents: number;
  perishable: boolean;
  description: string;
  imageUrl: string | null;
  trackStock: boolean;
  barcodes: string[];
  /** Visível no ERP (backoffice / pickers). Default true. */
  availableOnErp: boolean;
  /** Visível no PDV. Default true. */
  availableOnPdv: boolean;
  /**
   * Unidades onde o produto opera. Lista vazia = existe no cadastro da empresa
   * mas em nenhuma filial — estado de item recém-criado ou descontinuado.
   */
  branchIds: string[];
  suppliers: ProductSupplierLink[];
  variationFormat: ProductVariationFormat | null;
  variations: ProductVariationLink[];
  /** Denormalizado a partir de `variations.length`. */
  hasVariants: boolean;
  /** Denormalizado a partir de `variations.length`. */
  variantsCount: number;
  addonSettings: ProductAddonSettingsProps;
  addonLines: ProductAddonLineLink[];
  suggestions: ProductSuggestionLink[];
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateProductInput = {
  name: string;
  sku: string;
  categoryId: string;
  unitOfMeasureId: string | null;
  type: ProductType;
  basePriceCents: number;
  perishable: boolean;
  description: string;
  imageUrl: string | null;
  trackStock: boolean;
  barcodes: string[];
  availableOnErp: boolean;
  availableOnPdv: boolean;
  branchIds: string[];
  suppliers: ProductSupplierLink[];
  variationFormat: ProductVariationFormat | null;
  variations: ProductVariationLink[];
  addonSettings: ProductAddonSettingsProps;
  addonLines: ProductAddonLineLink[];
  suggestions: ProductSuggestionLink[];
};

type CreateProductProps = Optional<
  ProductProps,
  | 'unitOfMeasureId'
  | 'type'
  | 'basePriceCents'
  | 'perishable'
  | 'description'
  | 'imageUrl'
  | 'trackStock'
  | 'barcodes'
  | 'availableOnErp'
  | 'availableOnPdv'
  | 'branchIds'
  | 'suppliers'
  | 'variationFormat'
  | 'variations'
  | 'hasVariants'
  | 'variantsCount'
  | 'addonSettings'
  | 'addonLines'
  | 'suggestions'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt'
>;

function syncVariantFlags(variations: ProductVariationLink[]): {
  hasVariants: boolean;
  variantsCount: number;
} {
  return {
    hasVariants: variations.length > 0,
    variantsCount: variations.length,
  };
}

export class Product extends Entity<ProductProps> {
  constructor(props: ProductProps, id?: string) {
    super(props, id);
    this.validate();
  }

  protected validate(): void {
    ProductValidatorFactory.create().validate(this);
  }

  public static create(props: CreateProductProps, id?: string): Product {
    const variations = props.variations ?? [];
    const flags = syncVariantFlags(variations);
    return new Product(
      {
        ...props,
        unitOfMeasureId: props.unitOfMeasureId ?? null,
        type: props.type ?? 'simple',
        basePriceCents: props.basePriceCents ?? 0,
        perishable: props.perishable ?? false,
        description: props.description ?? '',
        imageUrl: props.imageUrl ?? null,
        trackStock: props.trackStock ?? false,
        barcodes: props.barcodes ?? [],
        availableOnErp: props.availableOnErp ?? true,
        availableOnPdv: props.availableOnPdv ?? true,
        branchIds: props.branchIds ?? [],
        suppliers: props.suppliers ?? [],
        variationFormat: props.variationFormat ?? null,
        variations,
        hasVariants: props.hasVariants ?? flags.hasVariants,
        variantsCount: props.variantsCount ?? flags.variantsCount,
        addonSettings: props.addonSettings ?? DEFAULT_ADDON_SETTINGS,
        addonLines: props.addonLines ?? [],
        suggestions: props.suggestions ?? [],
        deletedAt: props.deletedAt ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  public static with(props: ProductProps, id: string): Product {
    return new Product(props, id);
  }

  get organizationId() {
    return this.props.organizationId;
  }
  get name() {
    return this.props.name;
  }
  get sku() {
    return this.props.sku;
  }
  get categoryId() {
    return this.props.categoryId;
  }
  get unitOfMeasureId() {
    return this.props.unitOfMeasureId;
  }
  get type() {
    return this.props.type;
  }
  get basePriceCents() {
    return this.props.basePriceCents;
  }
  get perishable() {
    return this.props.perishable;
  }
  get description() {
    return this.props.description;
  }
  get imageUrl() {
    return this.props.imageUrl;
  }
  get trackStock() {
    return this.props.trackStock;
  }
  get barcodes() {
    return this.props.barcodes;
  }
  get availableOnErp() {
    return this.props.availableOnErp;
  }
  get availableOnPdv() {
    return this.props.availableOnPdv;
  }
  get branchIds() {
    return this.props.branchIds;
  }
  get suppliers() {
    return this.props.suppliers;
  }
  get variationFormat() {
    return this.props.variationFormat;
  }
  get variations() {
    return this.props.variations;
  }
  get hasVariants() {
    return this.props.hasVariants;
  }
  get variantsCount() {
    return this.props.variantsCount;
  }
  get addonSettings() {
    return this.props.addonSettings;
  }
  get addonLines() {
    return this.props.addonLines;
  }
  get suggestions() {
    return this.props.suggestions;
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

  /** True quando `imageUrl` guarda a object key no MinIO. */
  public hasImage(): boolean {
    return this.props.imageUrl !== null && this.props.imageUrl.length > 0;
  }

  /** Persiste a object key do MinIO em `imageUrl` (não é URL pública). */
  public setImage(objectKey: string): void {
    this.props.imageUrl = objectKey;
    this.touch();
  }

  public clearImage(): void {
    if (this.props.imageUrl === null) return;
    this.props.imageUrl = null;
    this.touch();
  }

  public touch(): void {
    this.props.updatedAt = new Date();
  }

  public update(input: UpdateProductInput): void {
    const flags = syncVariantFlags(input.variations);
    Object.assign(this.props, {
      name: input.name,
      sku: input.sku,
      categoryId: input.categoryId,
      unitOfMeasureId: input.unitOfMeasureId,
      type: input.type,
      basePriceCents: input.basePriceCents,
      perishable: input.perishable,
      description: input.description,
      imageUrl: input.imageUrl,
      trackStock: input.trackStock,
      barcodes: input.barcodes,
      availableOnErp: input.availableOnErp,
      availableOnPdv: input.availableOnPdv,
      branchIds: input.branchIds,
      suppliers: input.suppliers,
      variationFormat: input.variationFormat,
      variations: input.variations,
      hasVariants: flags.hasVariants,
      variantsCount: flags.variantsCount,
      addonSettings: input.addonSettings,
      addonLines: input.addonLines,
      suggestions: input.suggestions,
    });
    this.touch();
    this.validate();
  }

  /** Soft-delete: mantém o registro e move o produto para a aba "Excluídos". */
  public softDelete(at: Date = new Date()): void {
    if (this.props.deletedAt !== null) return;
    this.props.deletedAt = at;
    this.touch();
  }

  public restore(): void {
    if (this.props.deletedAt === null) return;
    this.props.deletedAt = null;
    this.touch();
  }
}

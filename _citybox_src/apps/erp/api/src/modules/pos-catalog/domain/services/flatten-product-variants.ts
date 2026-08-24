import type {
  Product,
  ProductVariationLink,
} from '../../../catalog/domain/entities/product.entity';
import type { Variation } from '../../../catalog/domain/entities/variation.entity';

export type PosCatalogVariantDto = {
  id: string;
  productId: string;
  attributes: Record<string, string>;
  priceCents: number;
  barcode: string | null;
  available: true;
};

/**
 * Expande variações do produto em SKUs discretos para o PDV.
 *
 * - Sem `variationFormat` ou `composite` → lista vazia (produto simples).
 * - `grid` → produto cartesiano das opções selecionadas em cada dimensão.
 *
 * Preço da variante = preço resolvido do produto + soma dos preços das
 * opções (override do vínculo, senão preço do catálogo da opção).
 */
export function flattenProductVariants(
  product: Product,
  productPriceCents: number,
  variationsById: Map<string, Variation>,
): PosCatalogVariantDto[] {
  if (product.variationFormat !== 'grid' || product.variations.length === 0) {
    return [];
  }

  const dimensions = product.variations
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((link) => buildDimension(link, variationsById.get(link.variationId)))
    .filter((dim): dim is Dimension => dim !== null);

  if (dimensions.length === 0) return [];

  const combos = cartesian(dimensions);
  return combos.map((combo) => {
    const optionPrices = combo.reduce((sum, cell) => sum + cell.priceCents, 0);
    const barcodes = combo
      .map((cell) => cell.barcode)
      .filter((code): code is string => !!code);
    return {
      id: `${product.id}:${combo.map((c) => c.optionId).join(':')}`,
      productId: product.id,
      attributes: Object.fromEntries(
        combo.map((cell) => [cell.variationName, cell.optionName]),
      ),
      priceCents: productPriceCents + optionPrices,
      barcode: barcodes.length === 1 ? barcodes[0] : null,
      available: true as const,
    };
  });
}

type DimensionCell = {
  optionId: string;
  optionName: string;
  variationName: string;
  priceCents: number;
  barcode: string | null;
};

type Dimension = {
  variationName: string;
  cells: DimensionCell[];
};

function buildDimension(
  link: ProductVariationLink,
  template: Variation | undefined,
): Dimension | null {
  if (!template || link.optionIds.length === 0) return null;

  const optionById = new Map(
    template.options.map((option) => [option.id, option]),
  );
  const overrideById = new Map(
    link.optionOverrides.map((item) => [item.optionId, item]),
  );

  const cells: DimensionCell[] = [];
  for (const optionId of link.optionIds) {
    const option = optionById.get(optionId);
    if (!option) continue;
    const override = overrideById.get(optionId);
    cells.push({
      optionId,
      optionName: option.name,
      variationName: template.name,
      priceCents: override?.priceCents ?? option.priceCents,
      barcode: override?.barcode ?? null,
    });
  }

  if (cells.length === 0) return null;
  return { variationName: template.name, cells };
}

function cartesian(dimensions: Dimension[]): DimensionCell[][] {
  return dimensions.reduce<DimensionCell[][]>((acc, dimension) => {
    if (acc.length === 0) {
      return dimension.cells.map((cell) => [cell]);
    }
    const next: DimensionCell[][] = [];
    for (const prefix of acc) {
      for (const cell of dimension.cells) {
        next.push([...prefix, cell]);
      }
    }
    return next;
  }, []);
}

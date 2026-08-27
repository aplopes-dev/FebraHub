import type { ProductAttachedVariation } from "@/features/products/types/product-create";
import type { Variation } from "@/features/variations/types/variation";
import type {
  VariationComposition,
  VariationOptionComposition,
} from "@/features/technical-sheets/types/technical-sheet";

type BuildArgs = {
  /** Vínculos reais do produto (API). Quando ausente, composição fica vazia. */
  attached?: ProductAttachedVariation[];
  /** Catálogo de variações para resolver nomes/opções. */
  catalog?: Variation[];
};

/**
 * Deriva a composição das variações a partir dos vínculos do produto,
 * resolvendo nomes/opções pelo catálogo.
 * Ids determinísticos evitam mismatch de hidratação; componentes começam vazios
 * (o usuário adiciona os insumos de cada opção).
 */
export function buildVariationCompositionsForProduct(
  _productId: string,
  args: BuildArgs = {},
): VariationComposition[] {
  const attached = args.attached ?? [];
  const catalogById = new Map(
    (args.catalog ?? []).map((variation) => [variation.id, variation]),
  );

  return attached
    .map((item): VariationComposition | null => {
      const variation = catalogById.get(item.variationId);
      if (!variation) return null;

      const selected =
        item.optionIds.length > 0
          ? variation.options.filter((option) =>
              item.optionIds.includes(option.id),
            )
          : variation.options;

      const options: VariationOptionComposition[] = selected
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((option) => ({
          id: option.id,
          optionName: option.name,
          optionDescription: option.description || undefined,
          components: [],
        }));

      return {
        id: `vc-${variation.id}`,
        variationName: variation.name,
        options,
      };
    })
    .filter((composition): composition is VariationComposition =>
      composition != null,
    );
}

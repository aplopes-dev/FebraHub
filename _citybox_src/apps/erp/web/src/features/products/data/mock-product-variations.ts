import {
  createAttachedVariation,
  type ProductAttachedVariation,
} from "@/features/products/types/product-create";

/**
 * Variações do catálogo (`features/variations`) vinculadas a cada produto (mock).
 * É a ponte entre a aba "Variações" do produto e a "Composição das variações"
 * da ficha técnica — esta última deriva daqui, não de uma lista fixa.
 */
export const MOCK_PRODUCT_VARIATIONS: Record<string, ProductAttachedVariation[]> =
  {
    p1: [
      createAttachedVariation("var-1", ["opt-1-1", "opt-1-2", "opt-1-3"]),
      createAttachedVariation("var-2", ["opt-2-1", "opt-2-2", "opt-2-3"]),
    ],
    p2: [createAttachedVariation("var-1", ["opt-1-1", "opt-1-2"])],
    p6: [
      createAttachedVariation("var-8", [
        "opt-8-1",
        "opt-8-2",
        "opt-8-3",
        "opt-8-4",
      ]),
    ],
    p8: [createAttachedVariation("var-1", ["opt-1-1", "opt-1-2", "opt-1-3"])],
    p11: [createAttachedVariation("var-2", ["opt-2-1", "opt-2-2"])],
    p15: [
      createAttachedVariation("var-1", ["opt-1-1", "opt-1-2", "opt-1-3"]),
      createAttachedVariation("var-2", ["opt-2-1", "opt-2-3"]),
    ],
  };

export function getProductVariations(
  productId: string,
): ProductAttachedVariation[] {
  return (MOCK_PRODUCT_VARIATIONS[productId] ?? []).map((variation) => ({
    ...variation,
    optionIds: [...variation.optionIds],
    optionOverrides: variation.optionOverrides.map((item) => ({ ...item })),
  }));
}

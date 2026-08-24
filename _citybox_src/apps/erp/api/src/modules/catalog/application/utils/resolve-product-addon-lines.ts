import type { ProductAddonLineLink } from '../../domain/entities/product.entity';
import { ProductAddonRepository } from '../../domain/repositories/product-addon.repository.interface';
import { ProductAddonNotFoundError } from '../../domain/errors/product-addon-not-found.error';
import { ProductAddonDuplicateLineError } from '../../domain/errors/product-addon-duplicate-line.error';

export type ProductAddonLineInput = {
  addonId: string;
  maxQuantity?: number;
  priceCents: number;
  sortOrder?: number;
};

/**
 * Valida IDs da organização e normaliza as linhas de adicional do produto
 * (FR-008/FR-009). Diferente de `resolveProductVariations`, duplicata de
 * `addonId` é erro (409), não "o último vence" — o frontend nunca deveria
 * mandar a mesma linha duas vezes.
 */
export async function resolveProductAddonLines(
  addonRepository: ProductAddonRepository,
  organizationId: string,
  inputs: ProductAddonLineInput[] | undefined,
): Promise<ProductAddonLineLink[]> {
  const seen = new Set<string>();
  const lines: ProductAddonLineLink[] = [];

  for (const [index, input] of (inputs ?? []).entries()) {
    if (!input.addonId) continue;

    if (seen.has(input.addonId)) {
      throw new ProductAddonDuplicateLineError(input.addonId);
    }
    seen.add(input.addonId);

    const addon = await addonRepository.findById(organizationId, input.addonId);
    if (!addon) throw new ProductAddonNotFoundError(input.addonId);

    const maxQuantity = Math.max(1, Math.trunc(input.maxQuantity ?? 1));
    const priceCents = Math.max(0, Math.trunc(input.priceCents));

    lines.push({
      addonId: input.addonId,
      maxQuantity,
      priceCents,
      sortOrder: input.sortOrder ?? index,
    });
  }

  return lines.sort((a, b) => a.sortOrder - b.sortOrder);
}

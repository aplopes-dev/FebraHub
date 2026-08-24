import type {
  ProductVariationFormat,
  ProductVariationLink,
  ProductVariationOptionOverride,
} from '../../domain/entities/product.entity';
import { VariationRepository } from '../../domain/repositories/variation.repository.interface';
import { VariationNotFoundError } from '../../domain/errors/variation-not-found.error';
import { VariationOptionNotFoundError } from '../../domain/errors/variation-option-not-found.error';
import { VariationInvalidError } from '../../domain/errors/variation-invalid.error';

export type ProductVariationInput = {
  variationId: string;
  optionIds: string[];
  minChoices?: number;
  maxChoices?: number;
  optionOverrides?: Array<{
    optionId: string;
    priceCents?: number | null;
    barcode?: string | null;
  }>;
  sortOrder?: number;
};

/**
 * Valida IDs da organização e normaliza vínculos produto↔variação.
 * Duplicatas de variationId: o último vínculo vence.
 */
export async function resolveProductVariations(
  variationRepository: VariationRepository,
  organizationId: string,
  inputs: ProductVariationInput[] | undefined,
): Promise<ProductVariationLink[]> {
  const byVariationId = new Map<string, ProductVariationLink>();

  for (const [index, input] of (inputs ?? []).entries()) {
    if (!input.variationId) continue;

    const variation = await variationRepository.findById(
      organizationId,
      input.variationId,
    );
    if (!variation) throw new VariationNotFoundError(input.variationId);

    const optionIdSet = new Set(variation.options.map((option) => option.id));
    const optionIds = [...new Set(input.optionIds.filter(Boolean))];

    for (const optionId of optionIds) {
      if (!optionIdSet.has(optionId)) {
        throw new VariationOptionNotFoundError(optionId);
      }
    }

    const minChoices = Math.max(0, Math.trunc(input.minChoices ?? 1));
    const maxChoices = Math.max(minChoices, Math.trunc(input.maxChoices ?? 1));

    if (optionIds.length === 0) {
      throw new VariationInvalidError(
        'Selecione ao menos uma opção para cada variação vinculada',
      );
    }

    const overridesByOption = new Map<string, ProductVariationOptionOverride>();
    for (const override of input.optionOverrides ?? []) {
      if (!override.optionId) continue;
      if (!optionIdSet.has(override.optionId)) {
        throw new VariationOptionNotFoundError(override.optionId);
      }
      if (!optionIds.includes(override.optionId)) continue;
      overridesByOption.set(override.optionId, {
        optionId: override.optionId,
        priceCents:
          override.priceCents === undefined || override.priceCents === null
            ? null
            : Math.max(0, Math.trunc(override.priceCents)),
        barcode: override.barcode?.trim() || null,
      });
    }

    byVariationId.set(input.variationId, {
      variationId: input.variationId,
      optionIds,
      minChoices,
      maxChoices,
      optionOverrides: [...overridesByOption.values()],
      sortOrder: input.sortOrder ?? index,
    });
  }

  return [...byVariationId.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function resolveVariationFormat(
  format: ProductVariationFormat | null | undefined,
  variations: ProductVariationLink[],
): ProductVariationFormat | null {
  if (variations.length === 0) return null;
  return format ?? 'grid';
}

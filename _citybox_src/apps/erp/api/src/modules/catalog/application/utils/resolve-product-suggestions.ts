import type { ProductSuggestionLink } from '../../domain/entities/product.entity';
import { ProductRepository } from '../../domain/repositories/product.repository.interface';
import { ProductNotFoundError } from '../../domain/errors/product-not-found.error';
import { ProductSuggestionDuplicateLineError } from '../../domain/errors/product-suggestion-duplicate-line.error';
import { ProductSuggestionSelfReferenceError } from '../../domain/errors/product-suggestion-self-reference.error';

export type ProductSuggestionInput = {
  suggestedProductId: string;
  sortOrder?: number;
};

/**
 * Valida IDs da organização e normaliza as linhas de sugestão do produto
 * (FR-013/FR-014/FR-015). `ownerProductId` é o id do próprio produto sendo
 * salvo — no create, gerado antecipadamente pelo use case (ver
 * `CreateProductUseCase`) para permitir barrar a autossugestão antes de
 * qualquer gravação.
 */
export async function resolveProductSuggestions(
  productRepository: ProductRepository,
  organizationId: string,
  ownerProductId: string,
  inputs: ProductSuggestionInput[] | undefined,
): Promise<ProductSuggestionLink[]> {
  const seen = new Set<string>();
  const links: ProductSuggestionLink[] = [];

  for (const [index, input] of (inputs ?? []).entries()) {
    if (!input.suggestedProductId) continue;

    if (input.suggestedProductId === ownerProductId) {
      throw new ProductSuggestionSelfReferenceError(ownerProductId);
    }

    if (seen.has(input.suggestedProductId)) {
      throw new ProductSuggestionDuplicateLineError(input.suggestedProductId);
    }
    seen.add(input.suggestedProductId);

    const suggested = await productRepository.findById(
      organizationId,
      input.suggestedProductId,
    );
    if (!suggested) throw new ProductNotFoundError(input.suggestedProductId);

    links.push({
      suggestedProductId: input.suggestedProductId,
      sortOrder: input.sortOrder ?? index,
    });
  }

  return links.sort((a, b) => a.sortOrder - b.sortOrder);
}

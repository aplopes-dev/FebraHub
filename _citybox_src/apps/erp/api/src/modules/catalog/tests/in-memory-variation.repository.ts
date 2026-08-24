import {
  Variation,
  type VariationOptionProps,
} from '../domain/entities/variation.entity';
import {
  VariationRepository,
  type VariationListCriteria,
} from '../domain/repositories/variation.repository.interface';

function matchesSearch(variation: Variation, search?: string): boolean {
  const q = search?.trim().toLowerCase();
  if (!q) return true;
  return (
    variation.name.toLowerCase().includes(q) ||
    variation.options.some((option) => option.name.toLowerCase().includes(q))
  );
}

export class InMemoryVariationRepository extends VariationRepository {
  private variations = new Map<string, Variation>();
  /** Contagem de produtos vinculados (para testes de delete). */
  private productLinks = new Map<string, number>();

  findById(organizationId: string, id: string): Promise<Variation | null> {
    const variation = this.variations.get(id);
    return Promise.resolve(
      variation && variation.organizationId === organizationId
        ? variation
        : null,
    );
  }

  findAll(
    organizationId: string,
    criteria: VariationListCriteria = {},
  ): Promise<Variation[]> {
    const rows = [...this.variations.values()]
      .filter((variation) => variation.organizationId === organizationId)
      .filter((variation) => matchesSearch(variation, criteria.search))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    const start = criteria.skip ?? 0;
    const end = criteria.take !== undefined ? start + criteria.take : undefined;
    return Promise.resolve(rows.slice(start, end));
  }

  count(
    organizationId: string,
    criteria: Pick<VariationListCriteria, 'search'> = {},
  ): Promise<number> {
    return this.findAll(organizationId, { ...criteria }).then(
      (rows) => rows.length,
    );
  }

  countProductsUsing(
    organizationId: string,
    variationId: string,
  ): Promise<number> {
    const variation = this.variations.get(variationId);
    if (!variation || variation.organizationId !== organizationId) {
      return Promise.resolve(0);
    }
    return Promise.resolve(this.productLinks.get(variationId) ?? 0);
  }

  save(variation: Variation): Promise<Variation> {
    const options: VariationOptionProps[] = variation.options.map((option) => ({
      ...option,
    }));
    const stored = Variation.with(
      {
        organizationId: variation.organizationId,
        name: variation.name,
        calculation: { ...variation.calculation },
        options,
        productNames: [...variation.productNames],
        createdAt: variation.createdAt,
        updatedAt: variation.updatedAt,
      },
      variation.id,
    );
    this.variations.set(stored.id, stored);
    return Promise.resolve(stored);
  }

  delete(organizationId: string, id: string): Promise<void> {
    const variation = this.variations.get(id);
    if (variation && variation.organizationId === organizationId) {
      this.variations.delete(id);
      this.productLinks.delete(id);
    }
    return Promise.resolve();
  }

  /** Helper de teste: marca quantos produtos usam a variação. */
  setProductLinkCount(variationId: string, count: number): void {
    this.productLinks.set(variationId, count);
  }

  /** Helper de teste: atualiza productNames derivados. */
  setProductNames(variationId: string, productNames: string[]): void {
    const variation = this.variations.get(variationId);
    if (!variation) return;
    this.variations.set(
      variationId,
      Variation.with(
        {
          ...variation.props,
          productNames: [...productNames],
        },
        variation.id,
      ),
    );
  }

  clear(): void {
    this.variations.clear();
    this.productLinks.clear();
  }
}

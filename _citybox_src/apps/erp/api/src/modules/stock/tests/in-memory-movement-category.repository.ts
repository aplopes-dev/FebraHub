import {
  MovementCategory,
  type MovementCategoryType,
} from '../domain/entities/movement-category.entity';
import {
  formatMovementCategoryCode,
  parseMovementCategoryCodeNumber,
} from '../domain/movement-category-code';
import {
  MovementCategoryRepository,
  type MovementCategoryListCriteria,
} from '../domain/repositories/movement-category.repository.interface';

export class InMemoryMovementCategoryRepository extends MovementCategoryRepository {
  readonly categories = new Map<string, MovementCategory>();

  findById(
    organizationId: string,
    id: string,
  ): Promise<MovementCategory | null> {
    const category = this.categories.get(id);
    return Promise.resolve(
      category && category.organizationId === organizationId ? category : null,
    );
  }

  findAll(
    organizationId: string,
    criteria: MovementCategoryListCriteria = {},
  ): Promise<MovementCategory[]> {
    const filtered = this.filter(organizationId, criteria);
    const skip = criteria.skip ?? 0;
    const take = criteria.take ?? filtered.length;
    return Promise.resolve(filtered.slice(skip, skip + take));
  }

  count(
    organizationId: string,
    criteria: { search?: string; type?: MovementCategoryType } = {},
  ): Promise<number> {
    return Promise.resolve(this.filter(organizationId, criteria).length);
  }

  nextCode(organizationId: string): Promise<string> {
    let max = 0;
    for (const category of this.ofOrganization(organizationId)) {
      const n = parseMovementCategoryCodeNumber(category.code);
      if (n !== null && n > max) max = n;
    }
    return Promise.resolve(formatMovementCategoryCode(max + 1));
  }

  save(category: MovementCategory): Promise<MovementCategory> {
    this.categories.set(category.id, category);
    return Promise.resolve(category);
  }

  /** Ids marcados como "já usados em movimentação" pelo teste. */
  readonly inUseIds = new Set<string>();

  isInUse(organizationId: string, id: string): Promise<boolean> {
    const category = this.categories.get(id);
    if (!category || category.organizationId !== organizationId) {
      return Promise.resolve(false);
    }
    return Promise.resolve(this.inUseIds.has(id));
  }

  delete(organizationId: string, id: string): Promise<void> {
    const category = this.categories.get(id);
    if (category && category.organizationId === organizationId) {
      this.categories.delete(id);
    }
    return Promise.resolve();
  }

  private ofOrganization(organizationId: string): MovementCategory[] {
    return [...this.categories.values()].filter(
      (category) => category.organizationId === organizationId,
    );
  }

  private filter(
    organizationId: string,
    criteria: { search?: string; type?: MovementCategoryType },
  ): MovementCategory[] {
    const search = criteria.search?.trim().toLowerCase();

    return this.ofOrganization(organizationId)
      .filter((category) =>
        criteria.type ? category.type === criteria.type : true,
      )
      .filter((category) =>
        search
          ? category.name.toLowerCase().includes(search) ||
            category.code.toLowerCase().includes(search)
          : true,
      )
      .sort((a, b) => a.code.localeCompare(b.code, 'pt-BR'));
  }

  clear(): void {
    this.categories.clear();
  }
}

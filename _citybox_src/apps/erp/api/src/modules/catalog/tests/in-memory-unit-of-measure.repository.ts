import { UnitOfMeasure } from '../domain/entities/unit-of-measure.entity';
import {
  UnitOfMeasureRepository,
  type UnitOfMeasureListCriteria,
} from '../domain/repositories/unit-of-measure.repository.interface';

function matchesSearch(unit: UnitOfMeasure, search?: string): boolean {
  const q = search?.trim().toLowerCase();
  if (!q) return true;
  return (
    unit.name.toLowerCase().includes(q) ||
    unit.abbreviation.toLowerCase().includes(q)
  );
}

export class InMemoryUnitOfMeasureRepository extends UnitOfMeasureRepository {
  private units = new Map<string, UnitOfMeasure>();

  findById(organizationId: string, id: string): Promise<UnitOfMeasure | null> {
    const unit = this.units.get(id);
    return Promise.resolve(
      unit && unit.organizationId === organizationId ? unit : null,
    );
  }

  findByAbbreviation(
    organizationId: string,
    abbreviation: string,
  ): Promise<UnitOfMeasure | null> {
    const trimmed = abbreviation.trim().toLowerCase();
    if (!trimmed) return Promise.resolve(null);

    const unit = [...this.units.values()].find(
      (row) =>
        row.organizationId === organizationId &&
        row.abbreviation.toLowerCase() === trimmed,
    );
    return Promise.resolve(unit ?? null);
  }

  findAll(
    organizationId: string,
    criteria: UnitOfMeasureListCriteria = {},
  ): Promise<UnitOfMeasure[]> {
    const rows = [...this.units.values()]
      .filter((unit) => unit.organizationId === organizationId)
      .filter((unit) => (criteria.activeOnly ? unit.active : true))
      .filter((unit) => matchesSearch(unit, criteria.search))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    const start = criteria.skip ?? 0;
    const end = criteria.take !== undefined ? start + criteria.take : undefined;
    return Promise.resolve(rows.slice(start, end));
  }

  count(
    organizationId: string,
    criteria: Pick<UnitOfMeasureListCriteria, 'activeOnly' | 'search'> = {},
  ): Promise<number> {
    return this.findAll(organizationId, { ...criteria }).then(
      (rows) => rows.length,
    );
  }

  save(unit: UnitOfMeasure): Promise<UnitOfMeasure> {
    this.units.set(unit.id, unit);
    return Promise.resolve(unit);
  }

  delete(organizationId: string, id: string): Promise<void> {
    const unit = this.units.get(id);
    if (unit && unit.organizationId === organizationId) {
      this.units.delete(id);
    }
    return Promise.resolve();
  }

  clear(): void {
    this.units.clear();
  }
}

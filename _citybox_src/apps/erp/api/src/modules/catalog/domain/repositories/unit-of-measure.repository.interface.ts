import type { UnitOfMeasure } from '../entities/unit-of-measure.entity';

export type UnitOfMeasureListCriteria = {
  activeOnly?: boolean;
  search?: string;
  skip?: number;
  take?: number;
};

export abstract class UnitOfMeasureRepository {
  abstract findById(
    organizationId: string,
    id: string,
  ): Promise<UnitOfMeasure | null>;
  abstract findByAbbreviation(
    organizationId: string,
    abbreviation: string,
  ): Promise<UnitOfMeasure | null>;
  abstract findAll(
    organizationId: string,
    criteria?: UnitOfMeasureListCriteria,
  ): Promise<UnitOfMeasure[]>;
  abstract count(
    organizationId: string,
    criteria?: Pick<UnitOfMeasureListCriteria, 'activeOnly' | 'search'>,
  ): Promise<number>;
  abstract save(unit: UnitOfMeasure): Promise<UnitOfMeasure>;
  abstract delete(organizationId: string, id: string): Promise<void>;
}

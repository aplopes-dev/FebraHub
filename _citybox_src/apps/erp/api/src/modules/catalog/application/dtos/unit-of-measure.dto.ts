import type { UnitOfMeasure } from '../../domain/entities/unit-of-measure.entity';
import type { UnitKind } from '../../domain/entities/unit-of-measure.entity';

export type CreateUnitOfMeasureDto = {
  organizationId: string;
  name: string;
  abbreviation: string;
  kind: UnitKind;
  decimalPlaces?: number;
  active?: boolean;
};

export type UpdateUnitOfMeasureDto = {
  organizationId: string;
  id: string;
  name: string;
  abbreviation: string;
  kind: UnitKind;
  decimalPlaces: number;
  active: boolean;
};

export type DeleteUnitOfMeasureDto = {
  organizationId: string;
  id: string;
};

export type ListUnitsOfMeasureDto = {
  organizationId: string;
  activeOnly?: boolean;
  search?: string;
  page?: number;
  perPage?: number;
};

export type ListUnitsOfMeasureResult = {
  items: UnitOfMeasure[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

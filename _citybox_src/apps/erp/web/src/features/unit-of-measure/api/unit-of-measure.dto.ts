import type { UnitKind } from "@/features/unit-of-measure/types/unit-of-measure";

export type UnitOfMeasureDto = {
  id: string;
  name: string;
  abbreviation: string;
  kind: UnitKind;
  decimalPlaces: number;
  active: boolean;
};

export type UnitOfMeasureListMetaDto = {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export type UnitOfMeasureListResponseDto = {
  data: UnitOfMeasureDto[];
  meta: UnitOfMeasureListMetaDto;
};

export type UnitOfMeasureResponseDto = {
  data: UnitOfMeasureDto;
};

export type SaveUnitOfMeasurePayload = {
  name: string;
  abbreviation: string;
  kind: UnitKind;
  decimalPlaces: number;
  active: boolean;
};

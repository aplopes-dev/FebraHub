export type UnitKind = "unit" | "weight" | "volume" | "length" | "area";

export const UNIT_KIND_LABELS: Record<UnitKind, string> = {
  unit: "Unidade",
  weight: "Peso",
  volume: "Volume",
  length: "Comprimento",
  area: "Área",
};

export const UNIT_KIND_ORDER: UnitKind[] = [
  "unit",
  "weight",
  "volume",
  "length",
  "area",
];

export type UnitOfMeasure = {
  id: string;
  name: string;
  abbreviation: string;
  kind: UnitKind;
  decimalPlaces: number;
  active: boolean;
};

export type UnitOfMeasureFormValues = Omit<UnitOfMeasure, "id">;

export type UnitOfMeasureListParams = {
  search: string;
  page: number;
  perPage: number;
};

export type UnitOfMeasureListResult = {
  data: UnitOfMeasure[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
};

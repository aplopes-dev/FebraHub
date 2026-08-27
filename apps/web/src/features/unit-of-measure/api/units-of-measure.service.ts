"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  SaveUnitOfMeasurePayload,
  UnitOfMeasureDto,
  UnitOfMeasureListResponseDto,
  UnitOfMeasureResponseDto,
} from "@/features/unit-of-measure/api/unit-of-measure.dto";
import { toUnitOfMeasure } from "@/features/unit-of-measure/api/unit-of-measure.mapper";
import type {
  UnitOfMeasure,
  UnitOfMeasureListParams,
  UnitOfMeasureListResult,
} from "@/features/unit-of-measure/types/unit-of-measure";

function buildListQuery(params: UnitOfMeasureListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  if (params.search.trim()) query.set("search", params.search.trim());
  return query.toString();
}

export async function listUnitsOfMeasurePaginated(
  params: UnitOfMeasureListParams,
): Promise<UnitOfMeasureListResult> {
  const response = await apiFetch<UnitOfMeasureListResponseDto>(
    `/v1/units-of-measure?${buildListQuery(params)}`,
  );

  return {
    data: response.data.map(toUnitOfMeasure),
    meta: response.meta,
  };
}

export async function listActiveUnitsOfMeasure(): Promise<UnitOfMeasure[]> {
  const response = await apiFetch<{ data: UnitOfMeasureDto[] }>(
    "/v1/units-of-measure?active=true",
  );
  return response.data.map(toUnitOfMeasure);
}

export async function createUnitOfMeasure(
  payload: SaveUnitOfMeasurePayload,
): Promise<UnitOfMeasure> {
  const response = await apiFetch<UnitOfMeasureResponseDto>(
    "/v1/units-of-measure",
    { method: "POST", body: JSON.stringify(payload) },
  );
  return toUnitOfMeasure(response.data);
}

export async function updateUnitOfMeasure(
  id: string,
  payload: SaveUnitOfMeasurePayload,
): Promise<UnitOfMeasure> {
  const response = await apiFetch<UnitOfMeasureResponseDto>(
    `/v1/units-of-measure/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
  return toUnitOfMeasure(response.data);
}

export async function deleteUnitOfMeasure(id: string): Promise<void> {
  await apiFetch<void>(`/v1/units-of-measure/${id}`, {
    method: "DELETE",
  });
}

export function clampDecimalPlaces(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(3, Math.max(0, Math.trunc(value)));
}

function normalizeFormValues(
  values: Omit<UnitOfMeasure, "id">,
): SaveUnitOfMeasurePayload {
  return {
    name: values.name.trim(),
    abbreviation: values.abbreviation.trim(),
    kind: values.kind,
    decimalPlaces: clampDecimalPlaces(values.decimalPlaces),
    active: values.active,
  };
}

export function createEmptyUnitFormValues(): SaveUnitOfMeasurePayload {
  return {
    name: "",
    abbreviation: "",
    kind: "unit",
    decimalPlaces: 0,
    active: true,
  };
}

export function unitOfMeasureToFormValues(
  unit: UnitOfMeasure,
): SaveUnitOfMeasurePayload {
  return normalizeFormValues(unit);
}

export function formValuesToPayload(
  values: SaveUnitOfMeasurePayload,
): SaveUnitOfMeasurePayload {
  return normalizeFormValues(values);
}

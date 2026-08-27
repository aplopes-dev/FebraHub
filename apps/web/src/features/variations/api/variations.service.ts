"use client";

import { apiFetch, apiUpload } from "@/lib/api/client";
import type {
  SaveVariationPayload,
  VariationDto,
  VariationListResponseDto,
  VariationResponseDto,
} from "@/features/variations/api/variation.dto";
import {
  formValuesToSavePayload,
  toVariation,
} from "@/features/variations/api/variation.mapper";
import { DEFAULT_VARIATION_CALCULATION } from "@/features/variations/lib/variation-calculation";
import type {
  Variation,
  VariationFormValues,
  VariationListParams,
  VariationListResult,
  VariationOption,
} from "@/features/variations/types/variation";

function buildListQuery(params: VariationListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  if (params.search.trim()) query.set("search", params.search.trim());
  return query.toString();
}

export async function listVariationsPaginated(
  params: VariationListParams,
): Promise<VariationListResult> {
  const response = await apiFetch<VariationListResponseDto>(
    `/v1/variations?${buildListQuery(params)}`,
  );

  return {
    data: response.data.map(toVariation),
    meta: response.meta,
  };
}

/** Lista simples para drawers/selects (sem paginação). */
export async function listAllVariations(): Promise<Variation[]> {
  const response = await apiFetch<{ data: VariationDto[] }>(
    "/v1/variations",
  );
  return response.data.map(toVariation);
}

export async function getVariationById(
  id: string,
): Promise<Variation | null> {
  const response = await apiFetch<VariationResponseDto>(
    `/v1/variations/${id}`,
  );
  return toVariation(response.data);
}

export async function createVariation(
  values: VariationFormValues,
): Promise<Variation> {
  const payload: SaveVariationPayload = formValuesToSavePayload(values);
  const response = await apiFetch<VariationResponseDto>(
    "/v1/variations",
    { method: "POST", body: JSON.stringify(payload) },
  );
  return uploadPendingOptionImages(toVariation(response.data), values);
}

export async function updateVariation(
  id: string,
  values: VariationFormValues,
): Promise<Variation> {
  const payload: SaveVariationPayload = formValuesToSavePayload(values);
  const response = await apiFetch<VariationResponseDto>(
    `/v1/variations/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
  return uploadPendingOptionImages(toVariation(response.data), values);
}

export async function uploadVariationOptionImage(
  variationId: string,
  optionId: string,
  file: File,
): Promise<Variation> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiUpload<VariationResponseDto>(
    `/v1/variations/${variationId}/options/${optionId}/image`,
    formData,
  );
  return toVariation(response.data);
}

async function uploadPendingOptionImages(
  savedVariation: Variation,
  values: VariationFormValues,
): Promise<Variation> {
  const pendingOptions = values.options
    .filter((option) => option.name.trim().length > 0)
    .map((option, sortOrder) => ({ option, sortOrder }))
    .filter(
      (
        candidate,
      ): candidate is {
        option: VariationOption & { pendingImageFile: File };
        sortOrder: number;
      } => candidate.option.pendingImageFile != null,
    );

  let latestVariation = savedVariation;
  for (const { option, sortOrder } of pendingOptions) {
    const savedOption =
      latestVariation.options.find(
        (candidate) => candidate.sortOrder === sortOrder,
      ) ??
      latestVariation.options.find(
        (candidate) => candidate.name === option.name.trim(),
      );
    if (!savedOption) {
      throw new Error(
        `Não foi possível localizar a opção "${option.name}" após salvar`,
      );
    }
    latestVariation = await uploadVariationOptionImage(
      latestVariation.id,
      savedOption.id,
      option.pendingImageFile,
    );
  }

  for (const { option } of pendingOptions) {
    if (option.imageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(option.imageUrl);
    }
  }
  return latestVariation;
}

export async function deleteVariation(id: string): Promise<void> {
  await apiFetch<void>(`/v1/variations/${id}`, { method: "DELETE" });
}

export async function addOptionToVariation(
  variationId: string,
  option: Omit<VariationOption, "sortOrder"> & { sortOrder?: number },
): Promise<Variation> {
  const current = await getVariationById(variationId);
  if (!current) {
    throw new Error("Variação não encontrada");
  }

  return updateVariation(variationId, {
    name: current.name,
    calculation: current.calculation,
    options: [
      ...current.options,
      {
        ...option,
        sortOrder: option.sortOrder ?? current.options.length,
      },
    ],
  });
}

export function formatVariationOptions(variation: Variation): string {
  return [...variation.options]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((option) => option.name)
    .filter(Boolean)
    .join(", ");
}

export function createEmptyVariationOption(
  sortOrder = 0,
): VariationFormValues["options"][number] {
  return {
    id: `opt-${crypto.randomUUID()}`,
    name: "",
    description: "",
    imageUrl: null,
    pendingImageFile: null,
    price: 0,
    code: "",
    sortOrder,
  };
}

export function createEmptyVariationFormValues(): VariationFormValues {
  return {
    name: "",
    options: [createEmptyVariationOption(0)],
    calculation: { ...DEFAULT_VARIATION_CALCULATION },
  };
}

export function variationToFormValues(
  variation: Variation,
): VariationFormValues {
  return {
    name: variation.name,
    calculation: { ...variation.calculation },
    options: [...variation.options]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((option) => ({ ...option })),
  };
}

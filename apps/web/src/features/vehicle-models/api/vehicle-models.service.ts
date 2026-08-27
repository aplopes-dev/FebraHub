"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  ChangeVehicleModelStatusPayload,
  CreateVehicleModelPayload,
  ListVehicleModelsResponseDto,
  UpdateVehicleModelPayload,
  VehicleModelDto,
} from "@/features/vehicle-models/api/vehicle-model.dto";
import { toVehicleModel } from "@/features/vehicle-models/api/vehicle-model.mapper";
import type {
  VehicleModel,
  VehicleModelListParams,
  VehicleModelStatus,
} from "@/features/vehicle-models/types/vehicle-model";

function buildListQuery(params: VehicleModelListParams): string {
  if (!params.status) return "";
  const query = new URLSearchParams();
  query.set("status", params.status);
  return `?${query.toString()}`;
}

export async function listVehicleModels(
  params: VehicleModelListParams = {},
): Promise<VehicleModel[]> {
  const response = await apiFetch<ListVehicleModelsResponseDto>(
    `/vehicle-models${buildListQuery(params)}`,
  );
  return response.items.map(toVehicleModel);
}

export async function getVehicleModelById(id: string): Promise<VehicleModel> {
  const dto = await apiFetch<VehicleModelDto>(`/vehicle-models/${id}`);
  return toVehicleModel(dto);
}

export async function createVehicleModel(
  payload: CreateVehicleModelPayload,
): Promise<VehicleModel> {
  const dto = await apiFetch<VehicleModelDto>("/vehicle-models", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return toVehicleModel(dto);
}

export async function updateVehicleModel(
  id: string,
  payload: UpdateVehicleModelPayload,
): Promise<VehicleModel> {
  const dto = await apiFetch<VehicleModelDto>(`/vehicle-models/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return toVehicleModel(dto);
}

export async function changeVehicleModelStatus(
  id: string,
  status: VehicleModelStatus,
): Promise<VehicleModel> {
  const payload: ChangeVehicleModelStatusPayload = { status };
  const dto = await apiFetch<VehicleModelDto>(`/vehicle-models/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return toVehicleModel(dto);
}

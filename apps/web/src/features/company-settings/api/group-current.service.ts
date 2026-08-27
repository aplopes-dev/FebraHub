"use client";

import { apiFetch, apiUpload } from "@/lib/api/client";
import type {
  GroupCurrentDto,
  GroupCurrentResponseDto,
  UpdateGroupCurrentPayload,
} from "@/features/company-settings/api/group-current.dto";

export async function getCurrentGroupApi(): Promise<GroupCurrentDto> {
  const response = await apiFetch<GroupCurrentResponseDto>("/v1/groups/current");
  return response.data;
}

export async function updateCurrentGroupApi(
  payload: UpdateGroupCurrentPayload,
): Promise<GroupCurrentDto> {
  const response = await apiFetch<GroupCurrentResponseDto>("/v1/groups/current", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function uploadGroupLogoApi(file: File): Promise<GroupCurrentDto> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiUpload<GroupCurrentResponseDto>(
    "/v1/groups/current/logo",
    formData,
  );
  return response.data;
}

export async function deleteGroupLogoApi(): Promise<GroupCurrentDto> {
  const response = await apiFetch<GroupCurrentResponseDto>(
    "/v1/groups/current/logo",
    { method: "DELETE" },
  );
  return response.data;
}

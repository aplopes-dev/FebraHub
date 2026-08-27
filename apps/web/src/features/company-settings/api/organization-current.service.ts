"use client";

import { apiFetch, apiUpload } from "@/lib/api/client";
import type {
  OrganizationCurrentDto,
  OrganizationCurrentResponseDto,
  UpdateOrganizationCurrentPayload,
} from "@/features/company-settings/api/organization-current.dto";

export async function getCurrentOrganizationApi(): Promise<OrganizationCurrentDto> {
  const response = await apiFetch<OrganizationCurrentResponseDto>(
    "/v1/organizations/current",
  );
  return response.data;
}

export async function updateCurrentOrganizationApi(
  payload: UpdateOrganizationCurrentPayload,
): Promise<OrganizationCurrentDto> {
  const response = await apiFetch<OrganizationCurrentResponseDto>(
    "/v1/organizations/current",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
  return response.data;
}

export async function uploadOrganizationLogoApi(
  file: File,
): Promise<OrganizationCurrentDto> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiUpload<OrganizationCurrentResponseDto>(
    "/v1/organizations/current/logo",
    formData,
  );
  return response.data;
}

export async function deleteOrganizationLogoApi(): Promise<OrganizationCurrentDto> {
  const response = await apiFetch<OrganizationCurrentResponseDto>(
    "/v1/organizations/current/logo",
    { method: "DELETE" },
  );
  return response.data;
}

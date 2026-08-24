"use client";

import { comercioFetch } from "@/lib/api/comercio-client";
import type {
  OrganizationCurrentDto,
  OrganizationCurrentResponseDto,
  UpdateOrganizationCurrentPayload,
} from "@/features/company-settings/api/organization-current.dto";

export async function getCurrentOrganizationApi(): Promise<OrganizationCurrentDto> {
  const response = await comercioFetch<OrganizationCurrentResponseDto>(
    "/v1/organizations/current",
  );
  return response.data;
}

export async function updateCurrentOrganizationApi(
  payload: UpdateOrganizationCurrentPayload,
): Promise<OrganizationCurrentDto> {
  const response = await comercioFetch<OrganizationCurrentResponseDto>(
    "/v1/organizations/current",
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
  return response.data;
}

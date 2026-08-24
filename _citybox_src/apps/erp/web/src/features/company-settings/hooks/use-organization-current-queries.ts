"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/lib/organization-context";
import { getCurrentOrganizationApi } from "@/features/company-settings/api/organization-current.service";
import { organizationCurrentKeys } from "@/features/company-settings/hooks/query-keys";

export function useCurrentOrganizationQuery() {
  const { organizationId, hydrated } = useOrganization();

  return useQuery({
    queryKey: organizationCurrentKeys.detail(organizationId),
    queryFn: () => getCurrentOrganizationApi(),
    enabled: hydrated && Boolean(organizationId),
  });
}

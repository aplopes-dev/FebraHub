"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/lib/organization-context";
import { getCurrentGroupApi } from "@/features/company-settings/api/group-current.service";
import { groupCurrentKeys } from "@/features/company-settings/hooks/query-keys";

export function useCurrentGroupQuery() {
  const { organizationId, hydrated } = useOrganization();

  return useQuery({
    queryKey: groupCurrentKeys.detail(organizationId),
    queryFn: () => getCurrentGroupApi(),
    enabled: hydrated && Boolean(organizationId),
  });
}

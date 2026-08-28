"use client";

import { useQuery } from "@tanstack/react-query";
import { getCommercialOverview } from "@/features/commercial-overview/services/overview.service";
import { useCatalogScope } from "@/lib/organization-context";

export function useCommercialOverviewQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: ["commercial", scope, "overview"],
    queryFn: async () => getCommercialOverview(),
    enabled: ready,
  });
}

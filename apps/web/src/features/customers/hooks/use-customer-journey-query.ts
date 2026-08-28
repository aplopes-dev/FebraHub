"use client";

import { useQuery } from "@tanstack/react-query";
import { getCustomerJourney } from "@/features/customers/api/customer-journey.service";
import { useCatalogScope } from "@/lib/organization-context";

export function useCustomerJourneyQuery(customerId: string | undefined) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: ["customers", scope, "journey", customerId ?? ""],
    queryFn: () => getCustomerJourney(customerId!),
    enabled: ready && Boolean(customerId),
  });
}

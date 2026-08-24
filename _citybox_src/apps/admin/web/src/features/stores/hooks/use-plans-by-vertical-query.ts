"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPlans, type PlanDto } from "@/lib/admin-api";

export function usePlansByVerticalQuery(vertical: string, options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: ["plans", "active", vertical],
    queryFn: () => fetchPlans({ status: ["ACTIVE"], vertical, perPage: 100 }),
    staleTime: 60_000,
    enabled: (options?.enabled ?? true) && Boolean(vertical),
  });

  return {
    plans: (query.data?.data ?? []) as PlanDto[],
    isPending: query.isPending,
  };
}

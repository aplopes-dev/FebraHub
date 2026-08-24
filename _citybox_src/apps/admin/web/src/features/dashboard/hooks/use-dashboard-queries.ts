import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { fetchDashboardSummary } from "../api/dashboard-api";
import { dashboardKeys } from "../api/query-keys";

export function useDashboardSummary() {
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "este-mes";
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  const queryParams = { period, startDate, endDate };

  return useQuery({
    queryKey: dashboardKeys.summary(queryParams),
    queryFn: () => fetchDashboardSummary(queryParams),
  });
}

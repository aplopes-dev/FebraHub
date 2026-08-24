import type { FilterValues } from "@citybox/ui/organisms";
import type { Plan } from "../types";

interface FilterPlansParams {
  plans: Plan[];
  search: string;
  filters: FilterValues;
}

export function filterPlans({ plans, search, filters }: FilterPlansParams): Plan[] {
  const statusFilter = (filters.status as string[] | undefined) ?? [];
  const verticalFilter = (filters.vertical as string[] | undefined) ?? [];

  return plans.filter((plan) => {
    const matchesSearch =
      search.trim() === "" ||
      plan.name.toLowerCase().includes(search.toLowerCase()) ||
      plan.code.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(plan.status);

    const matchesVertical =
      verticalFilter.length === 0 || verticalFilter.includes(plan.vertical);

    return matchesSearch && matchesStatus && matchesVertical;
  });
}

export function getMostPopularPlan(plans: Plan[]): Plan | undefined {
  const active = plans.filter((p) => p.status === "ACTIVE");
  if (active.length === 0) return undefined;
  return active.reduce((best, plan) =>
    plan.subscriberCount > best.subscriberCount ? plan : best,
  );
}

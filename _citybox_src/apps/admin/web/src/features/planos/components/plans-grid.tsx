"use client";

import { CreditCard } from "lucide-react";
import type { FilterValues } from "@citybox/ui/organisms";
import type { Plan, PlanStatus } from "../types";
import { filterPlans, getMostPopularPlan } from "../lib/filter-plans";
import { PlanCard } from "./plan-card";

interface PlansGridProps {
  plans: Plan[];
  search: string;
  filters: FilterValues;
  onEdit: (plan: Plan) => void;
  onDuplicate: (plan: Plan) => void;
  onStatusChange: (planId: string, status: PlanStatus) => void;
  onDelete?: (plan: Plan) => void;
  deletingPlanId?: string | null;
}

export function PlansGrid({
  plans,
  search,
  filters,
  onEdit,
  onDuplicate,
  onStatusChange,
  onDelete,
  deletingPlanId,
}: PlansGridProps) {
  const filtered = filterPlans({ plans, search, filters });
  const popular = getMostPopularPlan(plans);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/50 py-16 text-center">
        <CreditCard className="h-8 w-8 text-foreground/25" />
        <div>
          <p className="font-medium text-foreground/70">Nenhum plano encontrado</p>
          <p className="mt-1 text-sm text-foreground/45">
            Ajuste a busca ou os filtros de status.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filtered.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          featured={popular?.id === plan.id}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          isDeleting={deletingPlanId === plan.id}
        />
      ))}
    </div>
  );
}

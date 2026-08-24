"use client";

import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@citybox/ui/atoms";
import { SearchInput } from "@citybox/ui/molecules";
import {
  PageHeader,
  FilterPopover,
  FilterPills,
  createEmptyValues,
} from "@citybox/ui/organisms";
import type { FilterValues } from "@citybox/ui/organisms";
import { extractApiMessage } from "@/lib/api-error";
import { fetchPlans, createPlan, updatePlan, deletePlan } from "@/lib/admin-api";
import type { PlanDto } from "@/lib/admin-api";
import { PlansGrid } from "@/features/planos/components/plans-grid";
import { PlanFormDialog } from "@/features/planos/components/plan-form-dialog";
import { EditPlanDialog } from "@/features/planos/components/edit-plan-dialog";
import { PLANS_FILTER_GROUPS } from "@/features/planos/components/plans-filter";
import type { Plan, PlanFormMode, PlanStatus, SubscriptionCycle } from "@/features/planos/types";
import { buildPlanPayload } from "@/features/planos/lib/build-plan-payload";
import type { PlanFormData } from "@/features/planos/schemas/plan-schema";

function mapDtoToPlan(dto: PlanDto): Plan {
  return {
    ...dto,
    status: dto.status as PlanStatus,
    vertical: dto.vertical ?? "",
    tier: dto.tier ?? "",
    maxNegocios: dto.maxNegocios ?? dto.maxStores,
    prices: (dto.prices || []).map((p) => ({
      ...p,
      cycle: p.cycle as SubscriptionCycle,
    })),
  };
}

const DEFAULT_FILTERS: FilterValues = {
  ...createEmptyValues(PLANS_FILTER_GROUPS),
  status: ["ACTIVE"],
};

export default function PlanosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<Extract<PlanFormMode, "create" | "duplicate">>("create");
  const [selectedPlan, setSelectedPlan] = useState<PlanDto | null>(null);

  const statusFilter = (filters.status as string[] | undefined) ?? [];
  const verticalFilter = (filters.vertical as string[] | undefined) ?? [];

  const { data: plansData, isLoading } = useQuery({
    queryKey: ["plans", { search, status: statusFilter, vertical: verticalFilter }],
    queryFn: () =>
      fetchPlans({
        search: search || undefined,
        status: statusFilter.length ? statusFilter : undefined,
        vertical: verticalFilter[0],
      }),
  });

  const createMutation = useMutation({
    mutationFn: (body: PlanFormData) => {
      const payload = buildPlanPayload(body);
      return createPlan({
        code: payload.code,
        name: payload.name,
        description: payload.description || "",
        prices: payload.prices,
        vertical: payload.vertical,
        tier: payload.tier,
        maxNegocios: payload.maxNegocios,
        maxUsers: payload.maxUsers,
        maxProducts: payload.maxProducts,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PlanFormData }) => {
      const payload = buildPlanPayload(data);
      return updatePlan(id, {
        code: payload.code,
        name: payload.name,
        description: payload.description || "",
        prices: payload.prices,
        vertical: payload.vertical,
        tier: payload.tier,
        maxNegocios: payload.maxNegocios,
        maxUsers: payload.maxUsers,
        maxProducts: payload.maxProducts,
        status: payload.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PlanStatus }) => {
      const plan = plansData?.data.find((p) => p.id === id);
      if (!plan) throw new Error("Plan not found");
      return updatePlan(id, {
        code: plan.code,
        name: plan.name,
        description: plan.description || "",
        prices: (plan.prices || []).map((p) => ({
          cycle: p.cycle as SubscriptionCycle,
          priceCents: p.priceCents,
        })),
        vertical: plan.vertical ?? "Comércio",
        tier: plan.tier ?? "",
        maxNegocios: plan.maxNegocios ?? plan.maxStores,
        maxUsers: plan.maxUsers,
        maxProducts: plan.maxProducts,
        status: status === "ACTIVE" ? "ACTIVE" : "HIDDEN",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plano excluído com sucesso.");
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });

  const plans = (plansData?.data ?? []).map(mapDtoToPlan);

  const openCreateDialog = useCallback(() => {
    setFormMode("create");
    setSelectedPlan(null);
    setFormDialogOpen(true);
  }, []);

  const openDuplicateDialog = useCallback((plan: (typeof plans)[0]) => {
    const dto = plansData?.data.find((p) => p.id === plan.id);
    if (!dto) return;
    setFormMode("duplicate");
    setSelectedPlan(dto);
    setFormDialogOpen(true);
  }, [plansData]);

  const openEditDialog = useCallback((plan: (typeof plans)[0]) => {
    const dto = plansData?.data.find((p) => p.id === plan.id);
    if (!dto) return;
    setSelectedPlan(dto);
    setEditDialogOpen(true);
  }, [plansData]);

  const handleStatusChange = useCallback(
    (planId: string, status: PlanStatus) => {
      statusMutation.mutate({ id: planId, status });
    },
    [statusMutation],
  );

  const handleDelete = useCallback(
    (plan: (typeof plans)[0]) => {
      deleteMutation.mutate(plan.id);
    },
    [deleteMutation],
  );

  return (
    <div className="flex flex-col gap-5 p-2">
      <PageHeader
        title="Planos"
        description="Gerencie os pacotes comerciais da plataforma CityBox."
        actions={
          <>
            <SearchInput
              id="plans-search"
              placeholder="Buscar plano..."
              className="w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FilterPopover
              groups={PLANS_FILTER_GROUPS}
              values={filters}
              onValuesChange={setFilters}
            />
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4" />
              Novo Plano
            </Button>
          </>
        }
      />

      <FilterPills
        groups={PLANS_FILTER_GROUPS}
        values={filters}
        onValuesChange={setFilters}
      />

      <PlansGrid
        plans={plans}
        search={search}
        filters={filters}
        onEdit={openEditDialog}
        onDuplicate={openDuplicateDialog}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        deletingPlanId={deleteMutation.isPending ? (deleteMutation.variables as string) : undefined}
      />

      <PlanFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        mode={formMode}
        plan={selectedPlan ? mapDtoToPlan(selectedPlan) : null}
        onSave={async (data) => {
          await createMutation.mutateAsync(data);
        }}
        isSaving={createMutation.isPending}
      />

      <EditPlanDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        plan={selectedPlan ? mapDtoToPlan(selectedPlan) : null}
        onSave={async (data) => {
          if (!selectedPlan) return;
          await updateMutation.mutateAsync({ id: selectedPlan.id, data });
        }}
        isSaving={updateMutation.isPending}
      />
    </div>
  );
}

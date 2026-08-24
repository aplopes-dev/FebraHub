"use client";

import { useState } from "react";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import { ModalForm } from "@citybox/ui/organisms";
import { usePlansByVerticalQuery } from "../../hooks/use-plans-by-vertical-query";
import { useChangeStorePlanMutation } from "../../hooks/use-store-mutations";
import { BILLING_CYCLE_OPTIONS, DUE_DAY_OPTIONS } from "../../lib/billing-options";
import type { LojaDetail } from "../../types";

interface ChangePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: LojaDetail;
}

export function ChangePlanDialog({ open, onOpenChange, detail }: ChangePlanDialogProps) {
  const { plans, isPending: isLoadingPlans } = usePlansByVerticalQuery(detail.vertical, {
    enabled: open,
  });
  const changePlanMutation = useChangeStorePlanMutation(detail.id);

  const [planId, setPlanId] = useState(detail.plan?.planId ?? "");
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">(
    detail.plan?.cycle ?? "MONTHLY",
  );
  const [dueDay, setDueDay] = useState(
    detail.plan ? String(new Date(detail.plan.currentPeriodEnd).getDate()) : "10",
  );

  const selectedPlan = plans.find((p) => p.id === planId);
  const availableCycles = selectedPlan
    ? BILLING_CYCLE_OPTIONS.filter((c) => selectedPlan.prices.some((p) => p.cycle === c.value))
    : BILLING_CYCLE_OPTIONS;

  function handlePlanChange(nextPlanId: string) {
    setPlanId(nextPlanId);
    const selected = plans.find((p) => p.id === nextPlanId);
    if (selected?.prices?.length) {
      setBillingCycle(selected.prices[0].cycle as "MONTHLY" | "YEARLY");
    }
  }

  async function handleSave() {
    if (!planId) return;
    await changePlanMutation.mutateAsync({
      planId,
      billingCycle,
      dueDay: Number(dueDay),
    });
    onOpenChange(false);
  }

  const planLabel = isLoadingPlans ? "Carregando planos..." : "Selecione o plano";

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Trocar Plano da Loja"
      subtitle={`Apenas planos da vertical ${detail.vertical} estão disponíveis — a vertical da loja é imutável.`}
      onSave={handleSave}
      isSaving={changePlanMutation.isPending}
      saveDisabled={!planId}
      saveLabel="Confirmar Troca"
      contentClassName="sm:max-w-[480px]"
    >
      <div className="flex flex-col gap-5 py-1">
        <div className="space-y-1.5">
          <Label htmlFor="change-plan-select">Novo Plano</Label>
          <Select value={planId} onValueChange={handlePlanChange} disabled={isLoadingPlans}>
            <SelectTrigger id="change-plan-select" className="w-full">
              <SelectValue placeholder={planLabel} />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                  {plan.tier ? ` (${plan.tier})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="change-plan-cycle">Ciclo de Faturamento</Label>
            <Select
              value={billingCycle}
              onValueChange={(value) => setBillingCycle(value as "MONTHLY" | "YEARLY")}
            >
              <SelectTrigger id="change-plan-cycle" className="w-full">
                <SelectValue placeholder="Ciclo" />
              </SelectTrigger>
              <SelectContent>
                {availableCycles.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="change-plan-due-day">Vencimento</Label>
            <Select value={dueDay} onValueChange={setDueDay}>
              <SelectTrigger id="change-plan-due-day" className="w-full">
                <SelectValue placeholder="Dia" />
              </SelectTrigger>
              <SelectContent>
                {DUE_DAY_OPTIONS.map((dia) => (
                  <SelectItem key={dia} value={dia}>
                    Dia {dia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </ModalForm>
  );
}

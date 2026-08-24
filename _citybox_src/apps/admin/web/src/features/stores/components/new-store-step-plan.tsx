"use client";

import { useEffect, useRef } from "react";
import { Controller, useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import { usePlansByVerticalQuery } from "../hooks/use-plans-by-vertical-query";
import { BILLING_CYCLE_OPTIONS, DUE_DAY_OPTIONS } from "../lib/billing-options";
import type { NewStoreFormData } from "../schemas/new-store-schema";

interface NewStoreStepPlanProps {
  control: Control<NewStoreFormData>;
  setValue: UseFormSetValue<NewStoreFormData>;
}

export function NewStoreStepPlan({ control, setValue }: NewStoreStepPlanProps) {
  const vertical = useWatch({ control, name: "vertical" });
  const planId = useWatch({ control, name: "planId" });
  const { plans, isPending: isLoadingPlans } = usePlansByVerticalQuery(vertical);
  const selectedPlan = plans.find((p) => p.id === planId);

  // Um plano só é válido para a vertical em que foi selecionado — se o operador voltar ao step
  // de Identidade e trocar a vertical, o plano/ciclo escolhidos ficam obsoletos e precisam ser
  // limpos, senão o formulário poderia submeter um plano de vertical diferente da loja.
  const previousVertical = useRef(vertical);
  useEffect(() => {
    if (previousVertical.current !== vertical) {
      setValue("planId", "", { shouldValidate: false });
      setValue("billingCycle", "", { shouldValidate: false });
      previousVertical.current = vertical;
    }
  }, [vertical, setValue]);

  const availableCycles = selectedPlan
    ? BILLING_CYCLE_OPTIONS.filter((c) => selectedPlan.prices.some((p) => p.cycle === c.value))
    : BILLING_CYCLE_OPTIONS;

  function handlePlanChange(nextPlanId: string) {
    const selected = plans.find((p) => p.id === nextPlanId);
    if (selected?.prices?.length) {
      setValue("billingCycle", selected.prices[0].cycle, { shouldValidate: true });
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="planId">
          Plano <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="planId"
          control={control}
          render={({ field, fieldState }) => (
            <>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  handlePlanChange(value);
                }}
                disabled={isLoadingPlans}
              >
                <SelectTrigger id="planId" className="w-full">
                  <SelectValue
                    placeholder={isLoadingPlans ? "Carregando planos..." : "Selecione o plano"}
                  />
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
              {fieldState.error && (
                <p className="text-xs text-destructive">{fieldState.error.message}</p>
              )}
              {!isLoadingPlans && plans.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum plano ativo cadastrado para a vertical selecionada.
                </p>
              )}
            </>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="billingCycle">
            Ciclo de Faturamento <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="billingCycle"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="billingCycle" className="w-full">
                    <SelectValue placeholder="Recorrência" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCycles.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.error && (
                  <p className="text-xs text-destructive">{fieldState.error.message}</p>
                )}
              </>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dueDay">
            Dia de Vencimento <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="dueDay"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="dueDay" className="w-full">
                    <SelectValue placeholder="Dia do mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {DUE_DAY_OPTIONS.map((dia) => (
                      <SelectItem key={dia} value={dia}>
                        Dia {dia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.error && (
                  <p className="text-xs text-destructive">{fieldState.error.message}</p>
                )}
              </>
            )}
          />
        </div>
      </div>
    </div>
  );
}

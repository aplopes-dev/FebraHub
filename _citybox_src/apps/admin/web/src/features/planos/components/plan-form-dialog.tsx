"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ModalFormMultistep } from "@citybox/ui/organisms";
import {
  planSchema,
  PLAN_DEFAULT_VALUES,
  type PlanFormData,
} from "../schemas/plan-schema";
import { mapPlanToFormData } from "../lib/map-plan-to-form-data";
import { slugifyPlanCode } from "../lib/slugify-plan-code";
import type { Plan, PlanFormMode } from "../types";
import { PlanStepCommercial } from "./plan-step-commercial";
import { PlanStepQuotas } from "./plan-step-quotas";
import { PlanStepStatus } from "./plan-step-status";

const STEP_FIELD_GROUPS: (keyof PlanFormData)[][] = [
  ["vertical", "tier", "name", "description", "monthlyPrice", "yearlyPrice"],
  ["maxNegocios", "maxUsers", "maxProducts", "unlimitedProducts"],
  ["status", "code"],
];

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Extract<PlanFormMode, "create" | "duplicate">;
  plan?: Plan | null;
  onSave?: (data: PlanFormData) => Promise<void> | void;
  isSaving?: boolean;
}

function getSidebarTitle(mode: PlanFormMode): string {
  return mode === "duplicate" ? "Duplicar Plano" : "Novo Plano";
}

export function PlanFormDialog({
  open,
  onOpenChange,
  mode,
  plan,
  onSave,
  isSaving,
}: PlanFormDialogProps) {
  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema) as any,
    defaultValues: PLAN_DEFAULT_VALUES,
  });

  useEffect(() => {
    if (!open) return;

    if (plan && mode === "duplicate") {
      form.reset(mapPlanToFormData(plan, "duplicate"));
    } else {
      form.reset(PLAN_DEFAULT_VALUES);
    }
  }, [open, plan, mode, form]);

  const handleBeforeNext = async (stepIndex: number) => {
    const fieldsToValidate = STEP_FIELD_GROUPS[stepIndex];
    if (!fieldsToValidate) return true;
    return form.trigger(fieldsToValidate);
  };

  const handleSave = form.handleSubmit(
    async (data) => {
      try {
        if (onSave) {
          await onSave(data);
        }
        form.reset(PLAN_DEFAULT_VALUES);
        onOpenChange(false);
      } catch (err) {
        // Keep dialog open on error
      }
    },
    (errors) => {
      const firstErrorField = Object.keys(errors)[0] as keyof PlanFormData;
      if (firstErrorField) {
        let stepName = "Formulário";
        if (["vertical", "tier", "name", "monthlyPrice", "yearlyPrice"].includes(firstErrorField)) {
          stepName = "Comercial";
        } else if (["maxNegocios", "maxUsers", "maxProducts"].includes(firstErrorField)) {
          stepName = "Limites";
        } else if (["status", "code"].includes(firstErrorField)) {
          stepName = "Status";
        }
        const errorMessage = errors[firstErrorField]?.message || "Verifique os campos.";
        toast.error(`Erro na etapa ${stepName}: ${errorMessage}`);
      }
    }
  );

  return (
    <ModalFormMultistep
      open={open}
      onOpenChange={onOpenChange}
      sidebarTitle={getSidebarTitle(mode)}
      sidebarSubtitle="Configure comercial, limites e status"
      steps={[
        {
          label: "Comercial",
          description: "Vitrine e preço",
          title: "Bloco Comercial",
          subtitle:
            "Como este plano se apresenta para o cliente e para o gateway de pagamento.",
          content: (
            <PlanStepCommercial
              control={form.control}
              register={form.register}
              errors={form.formState.errors}
              watch={form.watch}
              setValue={form.setValue}
              formState={form.formState}
            />
          ),
        },
        {
          label: "Limites",
          description: "Quotas do plano",
          title: "Bloco de Limites",
          subtitle:
            "As amarras do que o cliente pode registrar no banco de dados.",
          content: (
            <PlanStepQuotas
              control={form.control}
              register={form.register}
              errors={form.formState.errors}
              watch={form.watch}
              setValue={form.setValue}
            />
          ),
        },
        {
          label: "Status",
          description: "Visibilidade",
          title: "Status e Arquivamento",
          subtitle: "Controle se o plano está disponível para novas vendas.",
          content: (
            <PlanStepStatus
              control={form.control}
              register={form.register}
              errors={form.formState.errors}
              watch={form.watch}
              isEdit={false}
            />
          ),
        },
      ]}
      onBeforeNext={async (stepIndex) => {
        if (stepIndex === 0) {
          const valid = await form.trigger([
            "vertical",
            "tier",
            "name",
            "monthlyPrice",
            "yearlyPrice",
          ]);
          if (valid) {
            const name = form.getValues("name");
            const code = form.getValues("code");
            if (name && !code) {
              form.setValue("code", slugifyPlanCode(name));
            }
          }
          return valid;
        }
        if (stepIndex === 1) {
          return form.trigger(["maxNegocios", "maxUsers", "maxProducts"]);
        }
        return true;
      }}
      onClose={() => form.reset(PLAN_DEFAULT_VALUES)}
      onSave={handleSave}
      isSaving={isSaving}
    />
  );
}

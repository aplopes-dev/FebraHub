"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldErrors } from "react-hook-form";
import { ModalFormTabs, ConfirmDialog } from "@citybox/ui/organisms";
import {
  planSchema,
  PLAN_DEFAULT_VALUES,
  type PlanFormData,
} from "../schemas/plan-schema";
import { mapPlanToFormData } from "../lib/map-plan-to-form-data";
import type { Plan } from "../types";
import { PlanStepCommercial } from "./plan-step-commercial";
import { PlanStepQuotas } from "./plan-step-quotas";
import { PlanStepStatus } from "./plan-step-status";

const TAB_COMMERCIAL = "comercial";
const TAB_QUOTAS = "limites";
const TAB_STATUS = "status";

const TAB_FIELD_GROUPS: Record<string, (keyof PlanFormData)[]> = {
  [TAB_COMMERCIAL]: [
    "vertical",
    "tier",
    "name",
    "description",
    "monthlyPrice",
    "yearlyPrice",
  ],
  [TAB_QUOTAS]: ["maxNegocios", "maxUsers", "maxProducts", "unlimitedProducts"],
  [TAB_STATUS]: ["status", "code"],
};

function getFirstTabWithError(errors: FieldErrors<PlanFormData>): string | null {
  for (const [tab, fields] of Object.entries(TAB_FIELD_GROUPS)) {
    if (fields.some((field) => errors[field])) {
      return tab;
    }
  }
  return null;
}

interface EditPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: Plan | null;
  onSave?: (data: PlanFormData) => Promise<void> | void;
  isSaving?: boolean;
}

export function EditPlanDialog({ open, onOpenChange, plan, onSave, isSaving }: EditPlanDialogProps) {
  const [activeTab, setActiveTab] = useState(TAB_COMMERCIAL);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const pendingSubmitRef = useRef<PlanFormData | null>(null);
  const originalStatusRef = useRef<PlanFormData["status"]>("ACTIVE");

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema) as any,
    defaultValues: PLAN_DEFAULT_VALUES,
  });

  useEffect(() => {
    if (open && plan) {
      form.reset(mapPlanToFormData(plan, "edit"));
      originalStatusRef.current = plan.status;
      setActiveTab(TAB_COMMERCIAL);
    }
  }, [open, plan, form]);

  const persistPlan = async (data: PlanFormData) => {
    if (!plan || !onSave) return;
    try {
      await onSave(data);
      form.reset(PLAN_DEFAULT_VALUES);
      onOpenChange(false);
    } catch (err) {
      // Keep open on error
    }
  };

  const handleSave = form.handleSubmit(
    async (data) => {
      const isArchiving =
        originalStatusRef.current === "ACTIVE" && data.status === "HIDDEN";

      if (isArchiving) {
        pendingSubmitRef.current = data;
        setArchiveConfirmOpen(true);
        return;
      }

      await persistPlan(data);
    },
    (errors) => {
      const tabWithError = getFirstTabWithError(errors);
      if (tabWithError) {
        setActiveTab(tabWithError);
      }
    },
  );

  return (
    <>
      <ModalFormTabs
        open={open}
        onOpenChange={onOpenChange}
        title="Editar Plano"
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        defaultTab={TAB_COMMERCIAL}
        tabs={[
          {
            value: TAB_COMMERCIAL,
            label: "Comercial",
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
            value: TAB_QUOTAS,
            label: "Limites",
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
            value: TAB_STATUS,
            label: "Status",
            title: "Status e Arquivamento",
            subtitle:
              "Controle se o plano está disponível para novas vendas.",
            content: (
              <PlanStepStatus
                control={form.control}
                register={form.register}
                errors={form.formState.errors}
                watch={form.watch}
                isEdit
              />
            ),
          },
        ]}
        onClose={() => {
          form.reset(PLAN_DEFAULT_VALUES);
          setActiveTab(TAB_COMMERCIAL);
        }}
        onSave={handleSave}
        isSaving={isSaving}
      />

      <ConfirmDialog
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        title="Arquivar plano?"
        description={
          <>
            Este plano será marcado como <strong>Oculto (Legacy)</strong> e não
            aparecerá para novas vendas. Assinantes existentes continuarão
            normalmente.
          </>
        }
        confirmLabel="Arquivar"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
        onConfirm={() => {
          if (pendingSubmitRef.current) {
            persistPlan(pendingSubmitRef.current);
            pendingSubmitRef.current = null;
          }
          setArchiveConfirmOpen(false);
        }}
      />
    </>
  );
}

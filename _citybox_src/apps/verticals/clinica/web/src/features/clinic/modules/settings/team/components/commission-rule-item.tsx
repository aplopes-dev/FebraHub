"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { cn } from "@citybox/ui";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Checkbox,
} from "@citybox/ui/atoms";
import { ConfirmDialog } from "@citybox/ui/organisms";
import { EMPTY_BRL_CURRENCY } from "@/features/clinic/modules/settings/plans/lib/format-brl-currency";
import { usePatientPlanOptions } from "@/features/clinic/modules/patients/lib/use-patient-plan-options";
import {
  COMMISSION_SCOPE_ALL,
  COMMISSION_TYPE_LABELS,
  PAYMENT_TRIGGER_LABELS,
  type CommissionRule,
} from "../types/commission";
import { useCommissionPlanSpecialties } from "../lib/use-commission-plan-specialties";

/** Slot do chevron / lixeira — mesmo espaço em header, trigger e linhas internas. */
export const COMMISSION_RULE_ACTION_SLOT_CLASS =
  "flex w-9 shrink-0 items-center justify-center";

/** Grade compartilhada: Quando paga | Plano | Especialidade | Tipo (e espelho interno). */
export const COMMISSION_RULE_GRID_CLASS =
  "grid min-w-[36rem] flex-1 grid-cols-[minmax(9rem,2fr)_minmax(6rem,1fr)_minmax(7rem,1fr)_minmax(7rem,1fr)] gap-3 sm:gap-4";

/** Linha flex: grid + slot de ação (sem gap — evita o gap-6 do AccordionTrigger). */
export const COMMISSION_RULE_ROW_CLASS = "flex w-full min-w-0 items-center gap-0 px-3 sm:px-4";

type CommissionRuleItemProps = {
  rule: CommissionRule;
  disabled?: boolean;
  onUpdate: (patch: Partial<CommissionRule>) => void;
  onRemove: () => void;
};

type PendingTreatmentRemoval =
  | { mode: "single"; treatmentId: string; treatmentName: string }
  | { mode: "bulk"; treatmentIds: string[] };

function CommissionRuleSummary({ rule }: { rule: CommissionRule }) {
  const { plans } = usePatientPlanOptions();
  const planIsAll = rule.planId === COMMISSION_SCOPE_ALL;
  const { specialties } = useCommissionPlanSpecialties(
    planIsAll ? COMMISSION_SCOPE_ALL : rule.planId,
  );

  const planName = planIsAll
    ? "Todos"
    : (plans.find((p) => p.id === rule.planId)?.name ?? "—");
  const specialtyName =
    rule.specialtyId === COMMISSION_SCOPE_ALL
      ? "Todos"
      : (specialties.find((s) => s.id === rule.specialtyId)?.name ?? "—");

  return (
    <div className={cn(COMMISSION_RULE_GRID_CLASS, "text-left")}>
      <span className="truncate text-sm font-medium text-foreground">
        {rule.paymentTrigger
          ? PAYMENT_TRIGGER_LABELS[rule.paymentTrigger]
          : "—"}
      </span>
      <span className="truncate text-sm text-foreground">{planName}</span>
      <span className="truncate text-sm text-foreground">{specialtyName}</span>
      <span className="truncate text-sm text-foreground">
        {rule.commissionType
          ? COMMISSION_TYPE_LABELS[rule.commissionType]
          : "—"}
        {rule.commissionType === "percentage"
          ? ` — ${rule.percentageValue ?? 0}%`
          : rule.paymentTrigger === "budget_approved" && rule.commissionValueBrl
            ? ` — ${rule.commissionValueBrl}`
            : null}
      </span>
    </div>
  );
}

export function CommissionRuleItem({
  rule,
  disabled = false,
  onUpdate,
  onRemove,
}: CommissionRuleItemProps) {
  const planIsAll = rule.planId === COMMISSION_SCOPE_ALL;
  const { specialties } = useCommissionPlanSpecialties(
    planIsAll ? COMMISSION_SCOPE_ALL : rule.planId,
  );
  // Accordion só para valor fixo com tratamentos (não há tratamentos em aprovação de orçamento)
  const isExpandable =
    rule.commissionType === "fixed_value" &&
    rule.paymentTrigger !== "budget_approved";

  const assignedTreatments = useMemo(() => {
    if (!isExpandable) return [];
    const specialty = specialties.find((s) => s.id === rule.specialtyId);
    if (!specialty) return [];
    return specialty.treatments.filter(
      (t) => t.enabled && t.id in rule.treatmentCommissionValues,
    );
  }, [
    isExpandable,
    rule.specialtyId,
    rule.treatmentCommissionValues,
    specialties,
  ]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [pendingRemoval, setPendingRemoval] =
    useState<PendingTreatmentRemoval | null>(null);
  const [confirmRemoveRule, setConfirmRemoveRule] = useState(false);

  const allIds = assignedTreatments.map((t) => t.id);

  const allSelected =
    allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
  const someSelected = allIds.some((id) => selectedIds.has(id));
  const selectAllChecked: boolean | "indeterminate" = allSelected
    ? true
    : someSelected
      ? "indeterminate"
      : false;

  const handleSelectAll = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedIds(new Set(allIds));
      return;
    }
    setSelectedIds(new Set());
  };

  const handleToggleTreatment = (treatmentId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(treatmentId);
      } else {
        next.delete(treatmentId);
      }
      return next;
    });
  };

  const idsToRemove =
    pendingRemoval?.mode === "single"
      ? [pendingRemoval.treatmentId]
      : pendingRemoval?.mode === "bulk"
        ? pendingRemoval.treatmentIds
        : [];

  const removesEntireRule =
    idsToRemove.length > 0 &&
    idsToRemove.length >= assignedTreatments.length;

  const handleConfirmRemoveTreatment = () => {
    if (!pendingRemoval || idsToRemove.length === 0) return;

    // Remove todos os tratamentos da regra: exclui a regra inteira
    if (removesEntireRule) {
      setPendingRemoval(null);
      setSelectedIds(new Set());
      onRemove();
      return;
    }

    const next = { ...rule.treatmentCommissionValues };
    for (const treatmentId of idsToRemove) {
      delete next[treatmentId];
    }
    onUpdate({ treatmentCommissionValues: next });
    setSelectedIds((prev) => {
      const nextSelected = new Set(prev);
      for (const treatmentId of idsToRemove) {
        nextSelected.delete(treatmentId);
      }
      return nextSelected;
    });
    setPendingRemoval(null);
  };

  const ruleRemovalTitle = "Excluir regra de comissão";
  const ruleRemovalDescription =
    "A regra de comissão será excluída permanentemente da sua clínica. A partir de agora as comissões pagas não utilizarão mais essa regra.";

  const confirmDialog = (
    <ConfirmDialog
      open={pendingRemoval !== null}
      onOpenChange={(open) => {
        if (!open) setPendingRemoval(null);
      }}
      title={
        removesEntireRule
          ? ruleRemovalTitle
          : pendingRemoval?.mode === "bulk"
            ? "Remover comissão dos procedimentos selecionados?"
            : "Remover comissão deste procedimento?"
      }
      description={
        removesEntireRule ? (
          ruleRemovalDescription
        ) : pendingRemoval?.mode === "bulk" ? (
          <>
            Deseja remover a comissão dos{" "}
            <strong>{idsToRemove.length}</strong> procedimentos selecionados?
          </>
        ) : pendingRemoval?.mode === "single" ? (
          <>
            Deseja remover a comissão do procedimento{" "}
            <strong>{pendingRemoval.treatmentName}</strong>?
          </>
        ) : (
          ""
        )
      }
      confirmLabel="Excluir"
      cancelLabel="Cancelar"
      onConfirm={handleConfirmRemoveTreatment}
    />
  );

  const ruleRemovalConfirmDialog = (
    <ConfirmDialog
      open={confirmRemoveRule}
      onOpenChange={setConfirmRemoveRule}
      title={ruleRemovalTitle}
      description={ruleRemovalDescription}
      confirmLabel="Excluir"
      cancelLabel="Cancelar"
      onConfirm={() => {
        setConfirmRemoveRule(false);
        onRemove();
      }}
    />
  );

  const removeRuleButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:text-destructive"
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setConfirmRemoveRule(true);
      }}
      aria-label="Remover regra de comissão"
    >
      <Trash2 className="size-3.5" aria-hidden />
    </Button>
  );

  const hasTreatmentCommissionValues =
    Object.keys(rule.treatmentCommissionValues).length > 0;

  // Percentual, aprovação de orçamento, ou valor fixo sem valores por tratamento:
  // card estático com lixeira (evita accordion órfão sem ação de excluir).
  if (!isExpandable || !hasTreatmentCommissionValues) {
    return (
      <>
        <div
          className={cn(
            COMMISSION_RULE_ROW_CLASS,
            "rounded-lg border border-border/60 bg-background py-3",
          )}
        >
          <CommissionRuleSummary rule={rule} />
          <div className={COMMISSION_RULE_ACTION_SLOT_CLASS}>
            {removeRuleButton}
          </div>
        </div>
        {ruleRemovalConfirmDialog}
      </>
    );
  }

  return (
    <>
      <AccordionItem value={rule.id} className="border-0">
        <div
          className={cn(
            COMMISSION_RULE_ROW_CLASS,
            "rounded-lg border border-border/60 bg-background",
          )}
        >
          <AccordionTrigger
            className={cn(
              "flex min-w-0 flex-1 items-center gap-0 px-0 py-3 hover:no-underline",
              "justify-start **:data-[slot=accordion-trigger-icon]:hidden",
            )}
          >
            <CommissionRuleSummary rule={rule} />

            <span className={COMMISSION_RULE_ACTION_SLOT_CLASS}>
              <ChevronDown
                className="size-4 shrink-0 rotate-180 text-muted-foreground transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-0"
                aria-hidden
              />
            </span>
          </AccordionTrigger>

          <div className={COMMISSION_RULE_ACTION_SLOT_CLASS}>
            {removeRuleButton}
          </div>
        </div>

        <AccordionContent className="mt-0 overflow-hidden rounded-b-lg border border-t-0 border-border/60 bg-muted/20 p-0 [&>div]:pb-0">
          {assignedTreatments.length > 0 ? (
            <div className="flex w-full flex-col">
              <div
                className={cn(
                  COMMISSION_RULE_ROW_CLASS,
                  "border-b border-border/40 bg-muted/40 py-2",
                )}
              >
                <div className={COMMISSION_RULE_GRID_CLASS}>
                  <div className="col-span-2 flex items-center gap-2">
                    <Checkbox
                      checked={selectAllChecked}
                      disabled={disabled}
                      onCheckedChange={handleSelectAll}
                      aria-label="Selecionar todos os procedimentos"
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      Procedimento
                    </span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Valor procedimento
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    Valor comissão
                  </span>
                </div>
                <div className={COMMISSION_RULE_ACTION_SLOT_CLASS} aria-hidden />
              </div>

              {assignedTreatments.map((treatment, idx, arr) => {
                const isSelected = selectedIds.has(treatment.id);
                return (
                  <div
                    key={treatment.id}
                    className={cn(
                      COMMISSION_RULE_ROW_CLASS,
                      "py-2",
                      idx < arr.length - 1 && "border-b border-border/30",
                    )}
                  >
                    <div
                      className={cn(COMMISSION_RULE_GRID_CLASS, "items-center")}
                    >
                      <div className="col-span-2 flex min-w-0 items-center gap-2">
                        <Checkbox
                          checked={isSelected}
                          disabled={disabled}
                          onCheckedChange={(checked) =>
                            handleToggleTreatment(
                              treatment.id,
                              checked === true,
                            )
                          }
                          aria-label={`Selecionar ${treatment.name}`}
                        />
                        <span className="truncate text-sm font-medium text-foreground">
                          {treatment.name}
                        </span>
                      </div>
                      <span className="truncate text-sm text-foreground">
                        {treatment.treatmentValue}
                      </span>
                      <span className="truncate text-sm text-foreground">
                        {rule.treatmentCommissionValues[treatment.id] ??
                          EMPTY_BRL_CURRENCY}
                      </span>
                    </div>

                    <div className={COMMISSION_RULE_ACTION_SLOT_CLASS}>
                      {someSelected ? null : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-destructive"
                          disabled={disabled}
                          onClick={() =>
                            setPendingRemoval({
                              mode: "single",
                              treatmentId: treatment.id,
                              treatmentName: treatment.name,
                            })
                          }
                          aria-label={`Remover ${treatment.name}`}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {someSelected ? (
                <div className="flex items-center justify-end border-t border-border/40 px-4 py-3">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={disabled}
                    onClick={() =>
                      setPendingRemoval({
                        mode: "bulk",
                        treatmentIds: allIds.filter((id) => selectedIds.has(id)),
                      })
                    }
                  >
                    Excluir itens selecionados
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-1 px-4 py-3 text-sm text-muted-foreground">
              <p>Nenhum procedimento com valor de comissão atribuído.</p>
              {rule.allowValueExceedsTreatment ? (
                <p className="text-xs">
                  Permite comissão maior que o valor do procedimento.
                </p>
              ) : null}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      {confirmDialog}
      {ruleRemovalConfirmDialog}
    </>
  );
}

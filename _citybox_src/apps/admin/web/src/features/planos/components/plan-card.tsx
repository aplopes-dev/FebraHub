"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Copy, Pencil, Store, Users, Package, Trash2 } from "lucide-react";
import { Badge, Button, Label, Switch } from "@citybox/ui/atoms";
import { ConfirmDialog } from "@citybox/ui/organisms";
import { cn } from "@citybox/ui";
import type { Plan, PlanStatus } from "../types";
import { DASHBOARD_CARD, DASHBOARD_CARD_INNER } from "../lib/plans-ui";
import { planStatusConfig } from "../lib/plan-status-config";
import { formatPlanPrice } from "../lib/billing-cycle-config";

interface PlanCardProps {
  plan: Plan;
  featured?: boolean;
  onEdit: (plan: Plan) => void;
  onDuplicate: (plan: Plan) => void;
  onStatusChange: (planId: string, status: PlanStatus) => void;
  onDelete?: (plan: Plan) => void;
  isDeleting?: boolean;
}

function QuotaChip({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div
      className={cn(
        DASHBOARD_CARD_INNER,
        "flex items-center gap-2 px-3 py-2 text-sm text-foreground/70",
      )}
    >
      <span className="text-foreground/40">{icon}</span>
      {label}
    </div>
  );
}

export function PlanCard({
  plan,
  featured = false,
  onEdit,
  onDuplicate,
  onStatusChange,
  onDelete,
  isDeleting = false,
}: PlanCardProps) {
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const statusConfig = planStatusConfig[plan.status];
  const isActive = plan.status === "ACTIVE";
  const isHidden = plan.status === "HIDDEN";

  const handleSwitchChange = (checked: boolean) => {
    if (checked) {
      onStatusChange(plan.id, "ACTIVE");
      return;
    }
    setArchiveConfirmOpen(true);
  };

  return (
    <>
      <div
        className={cn(
          DASHBOARD_CARD,
          "flex flex-col p-5 transition-opacity",
          featured && "border-primary/40",
          isHidden && "opacity-70",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={statusConfig.className}>
              {statusConfig.label}
            </Badge>
            {featured && (
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/5 text-primary"
              >
                Popular
              </Badge>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Label
              htmlFor={`plan-active-${plan.id}`}
              className="text-xs text-foreground/50"
            >
              {isActive ? "Ativo" : "Inativo"}
            </Label>
            <Switch
              id={`plan-active-${plan.id}`}
              checked={isActive}
              onCheckedChange={handleSwitchChange}
            />
          </div>
        </div>

        <div className="mb-1">
          <div className="mb-1 flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wide">
              {plan.vertical || "—"}
            </Badge>
            {plan.tier && (
              <span className="text-xs text-foreground/50">{plan.tier}</span>
            )}
          </div>
          <h3 className="text-lg font-semibold tracking-tight text-[var(--orbitly-ink)]">
            {plan.name}
          </h3>
          {plan.description && (
            <p className="mt-1 line-clamp-2 text-sm text-foreground/50">
              {plan.description}
            </p>
          )}
        </div>

        <div className="my-4 min-h-[60px] flex flex-col justify-center">
          {(() => {
            const monthlyPrice = plan.prices?.find((p) => p.cycle === "MONTHLY");
            const yearlyPrice = plan.prices?.find((p) => p.cycle === "YEARLY");
            
            const formattedMonthly = monthlyPrice
              ? formatPlanPrice(monthlyPrice.priceCents, "MONTHLY")
              : null;
            const formattedYearly = yearlyPrice
              ? formatPlanPrice(yearlyPrice.priceCents, "YEARLY")
              : null;

            if (formattedMonthly && formattedYearly) {
              return (
                <div className="flex flex-col gap-0.5">
                  <span className="text-2xl font-bold tracking-tight text-[var(--orbitly-ink)]">
                    {formattedMonthly}
                  </span>
                  <span className="text-xs text-foreground/50">
                    ou {formattedYearly} (anual)
                  </span>
                </div>
              );
            }

            if (formattedMonthly) {
              return (
                <span className="text-2xl font-bold tracking-tight text-[var(--orbitly-ink)]">
                  {formattedMonthly}
                </span>
              );
            }

            if (formattedYearly) {
              return (
                <span className="text-2xl font-bold tracking-tight text-[var(--orbitly-ink)]">
                  {formattedYearly}
                </span>
              );
            }

            if (plan.prices && plan.prices.length > 0) {
              return (
                <div className="flex flex-col gap-0.5">
                  {plan.prices.map((p) => (
                    <span key={p.id} className="text-sm font-semibold text-[var(--orbitly-ink)]">
                      R$ {(p.priceCents / 100).toFixed(2)} ({p.cycle === "MONTHLY" ? "mensal" : "anual"})
                    </span>
                  ))}
                </div>
              );
            }

            return (
              <span className="text-lg text-foreground/45 font-medium">
                Sob consulta
              </span>
            );
          })()}
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <QuotaChip
            icon={<Store className="h-3.5 w-3.5" />}
            label={`${plan.maxNegocios} ${plan.maxNegocios === 1 ? "Negócio" : "Negócios"}`}
          />
          <QuotaChip
            icon={<Users className="h-3.5 w-3.5" />}
            label={`${plan.maxUsers} Usuários`}
          />
          <QuotaChip
            icon={<Package className="h-3.5 w-3.5" />}
            label={
              plan.maxProducts === null || plan.maxProducts === undefined
                ? "Produtos ilimitados"
                : `${plan.maxProducts.toLocaleString("pt-BR")} SKUs`
            }
          />
        </div>

        <p className="mb-5 text-xs text-foreground/45">
          {plan.subscriberCount.toLocaleString("pt-BR")} assinantes ativos
        </p>

        <div className="mt-auto flex items-center gap-2 border-t border-border/40 pt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 shadow-none"
            onClick={() => onEdit(plan)}
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 shadow-none"
            onClick={() => onDuplicate(plan)}
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicar
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="shadow-none text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={isDeleting}
              title="Excluir plano"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        title="Desativar plano?"
        description={
          <>
            O plano <strong>{plan.name}</strong> será arquivado e não aparecerá
            para novas vendas. Assinantes existentes continuarão normalmente.
          </>
        }
        confirmLabel="Desativar"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
        onConfirm={() => {
          onStatusChange(plan.id, "HIDDEN");
          setArchiveConfirmOpen(false);
        }}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Excluir plano?"
        description={
          <>
            Tem certeza que deseja excluir o plano{" "}
            <strong>{plan.name}</strong>? Esta ação não pode ser desfeita e
            removerá permanentemente o plano do sistema.
          </>
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
        isConfirming={isDeleting}
        onConfirm={() => {
          onDelete?.(plan);
          setDeleteConfirmOpen(false);
        }}
      />
    </>
  );
}

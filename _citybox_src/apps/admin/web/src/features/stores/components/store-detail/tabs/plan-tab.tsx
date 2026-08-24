"use client";

import { useState } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@citybox/ui/atoms";
import { RefreshCw } from "lucide-react";
import { formatCurrency, formatDateIso } from "@/lib/format-currency";
import { subscriptionStatusConfig } from "../../../lib/status-config";
import type { LojaDetail } from "../../../types";
import { ChangePlanDialog } from "../change-plan-dialog";

interface PlanTabProps {
  detail: LojaDetail;
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  return formatDateIso(dateStr.split("T")[0]);
}

export function PlanTab({ detail }: PlanTabProps) {
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const { plan } = detail;

  if (!plan) {
    return (
      <>
        <Card className="p-8 flex flex-col items-center justify-center gap-4 border-dashed shadow-none">
          <p className="text-sm text-muted-foreground italic">
            Esta loja não possui um plano ativo.
          </p>
          <Button variant="outline" size="sm" onClick={() => setChangePlanOpen(true)}>
            <RefreshCw className="size-4" />
            Definir Plano
          </Button>
        </Card>
        <ChangePlanDialog open={changePlanOpen} onOpenChange={setChangePlanOpen} detail={detail} />
      </>
    );
  }

  const config = subscriptionStatusConfig[plan.status];

  return (
    <>
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">{plan.planName}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {plan.vertical ?? detail.vertical}
              {plan.tier ? ` · ${plan.tier}` : ""}
            </p>
          </div>
          <Badge variant="outline" className={`${config.className} px-3 py-1 text-xs font-semibold`}>
            {config.label}
          </Badge>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground block">
                Valor
              </span>
              <span className="text-sm font-semibold block text-foreground">
                {formatCurrency(plan.priceCents)}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground block">
                Ciclo de Faturamento
              </span>
              <span className="text-sm font-semibold block text-foreground">
                {plan.cycle === "MONTHLY" ? "Mensal" : "Anual"}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground block">
                Início do Período
              </span>
              <span className="text-sm font-medium block text-muted-foreground">
                {formatDate(plan.currentPeriodStart)}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground block">
                Próximo Vencimento
              </span>
              <span className="text-sm font-semibold block text-foreground">
                {formatDate(plan.currentPeriodEnd)}
              </span>
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <Button variant="outline" size="sm" onClick={() => setChangePlanOpen(true)}>
              <RefreshCw className="size-4" />
              Trocar Plano
            </Button>
          </div>
        </CardContent>
      </Card>
      <ChangePlanDialog open={changePlanOpen} onOpenChange={setChangePlanOpen} detail={detail} />
    </>
  );
}

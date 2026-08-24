"use client";

import { useSearchParams } from "next/navigation";
import { DollarSign, Wallet } from "lucide-react";
import { FinanceHeroCard } from "../shared/finance-hero-card";
import { useBillingKpis } from "../../hooks/use-finance-queries";
import { formatBRL } from "../../lib/format-finance";

export function FinancialHeroCards() {
  const searchParams = useSearchParams();
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  const { data: kpis, isLoading } = useBillingKpis({
    startDate,
    endDate,
    enabled: !!startDate && !!endDate,
  });

  const mrr = kpis ? kpis.mrrCents / 100 : 0;
  const aReceber = kpis ? kpis.openAmountNext30DaysCents / 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <FinanceHeroCard
        label="Receita Recorrente (MRR)"
        value={isLoading ? "Carregando..." : formatBRL(mrr)}
        trend="Recorrência ativa dos planos"
        variant="lime"
        icon={<DollarSign className="h-4 w-4 text-[var(--orbitly-ink)]" />}
      />
      <FinanceHeroCard
        label="Previsão de Recebimento (30d)"
        value={isLoading ? "Carregando..." : formatBRL(aReceber)}
        trend="Faturas abertas a vencer"
        variant="teal"
        icon={<Wallet className="h-4 w-4 text-[var(--orbitly-ink)]" />}
      />
    </div>
  );
}

import { FinancialDashboardHeader } from "@/features/financeiro/components/dashboard/financial-dashboard-header";
import { FinancialHeroCards } from "@/features/financeiro/components/dashboard/financial-hero-cards";
import { FinancialKpiStrip } from "@/features/financeiro/components/dashboard/financial-kpi-strip";
import { FinancialGoalsRow } from "@/features/financeiro/components/dashboard/financial-goals-row";
import { RevenueComparisonChart } from "@/features/financeiro/components/dashboard/revenue-comparison-chart";
import { FinancialSummaryPanel } from "@/features/financeiro/components/dashboard/financial-summary-panel";

export default function FinanceiroPage() {
  return (
    <div className="flex flex-col gap-5">
      <FinancialDashboardHeader />
      <FinancialHeroCards />
      <FinancialKpiStrip />
      <FinancialGoalsRow />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
        <RevenueComparisonChart />
        <FinancialSummaryPanel />
      </div>
    </div>
  );
}

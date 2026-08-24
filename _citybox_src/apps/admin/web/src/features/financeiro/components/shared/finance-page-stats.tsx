import type { ReactNode } from "react";

interface FinancePageStatsProps {
  heroes: ReactNode;
  kpis: ReactNode;
}

export function FinancePageStats({ heroes, kpis }: FinancePageStatsProps) {
  return (
    <div className="flex flex-col gap-4">
      {heroes}
      {kpis}
    </div>
  );
}

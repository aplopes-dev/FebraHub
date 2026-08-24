"use client";

import Stack from "@mui/material/Stack";
import { CostCenterShareBar } from "@/features/cost-center-analysis/components/cost-center-share-bar";
import type { CostCenterAnalysisItem } from "@/features/cost-center-analysis/types/cost-center-analysis";

type CostCenterAnalysisTableProps = {
  items: CostCenterAnalysisItem[];
};

/** Lista os itens do relatório na ordem que a API já devolve (valor desc). */
export function CostCenterAnalysisTable({ items }: CostCenterAnalysisTableProps) {
  return (
    <Stack spacing={2.5}>
      {items.map((item) => (
        <CostCenterShareBar key={item.costCenterId ?? "outros"} item={item} />
      ))}
    </Stack>
  );
}

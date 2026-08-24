"use client";

import InboxOutlined from "@mui/icons-material/InboxOutlined";
import SearchOffOutlined from "@mui/icons-material/SearchOffOutlined";

import { Button, EmptyState } from "@citybox/mui";

type FinancialStatementEmptyStateProps = {
  /**
   * `"no-data"`: organização sem nenhuma movimentação, sem filtro aplicado.
   * `"no-match"`: algum filtro aplicado, mas nenhum resultado — FR-014.
   */
  variant: "no-data" | "no-match";
  onClearFilters: () => void;
};

export function FinancialStatementEmptyState({
  variant,
  onClearFilters,
}: FinancialStatementEmptyStateProps) {
  if (variant === "no-data") {
    return (
      <EmptyState
        icon={<InboxOutlined sx={{ fontSize: 32 }} />}
        title="Nenhuma movimentação registrada"
        description="Os lançamentos financeiros da organização aparecerão aqui assim que forem cadastrados."
      />
    );
  }

  return (
    <EmptyState
      icon={<SearchOffOutlined sx={{ fontSize: 32 }} />}
      title="Nenhuma movimentação encontrada com esses filtros"
      description="Tente ajustar o período, o tipo ou os demais filtros aplicados."
      action={
        <Button type="button" variant="outlined" onClick={onClearFilters}>
          Limpar filtros
        </Button>
      }
    />
  );
}

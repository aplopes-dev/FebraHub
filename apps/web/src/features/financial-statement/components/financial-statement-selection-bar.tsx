"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { Button, Typography } from "@/ui";
import { formatCurrencyBRL } from "@/features/financial-entries/lib/financial-entry-format";
import { surfaceBorderRadius } from "@/theme/surface-styles";

type FinancialStatementSelectionBarProps = {
  count: number;
  netCents: number;
  onClear: () => void;
};

/**
 * Barra de seleção (US3, FR-011) — visível só com `count > 0`. Soma
 * client-side sobre as linhas já carregadas (respeitando entrada/saída),
 * limpa automaticamente ao trocar filtro/página (`use-financial-statement-selection.ts`).
 */
export function FinancialStatementSelectionBar({
  count,
  netCents,
  onClear,
}: FinancialStatementSelectionBarProps) {
  if (count === 0) return null;

  const net = netCents / 100;

  return (
    <Paper
      variant="outlined"
      sx={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 1.5,
        px: 2,
        py: 1.25,
        mt: 1,
        borderRadius: surfaceBorderRadius,
        bgcolor: "action.hover",
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {count} {count === 1 ? "lançamento selecionado" : "lançamentos selecionados"}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: net >= 0 ? "success.main" : "error.main",
          }}
        >
          {formatCurrencyBRL(net)}
        </Typography>
      </Stack>
      <Button type="button" variant="outlined" size="small" onClick={onClear}>
        Limpar seleção
      </Button>
    </Paper>
  );
}

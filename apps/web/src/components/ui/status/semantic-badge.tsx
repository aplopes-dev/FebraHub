"use client";

import { alpha } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import { Badge } from "@/ui";

export type SemanticTone = "success" | "error" | "warning" | "info" | "neutral";

/**
 * Badge pastel: fundo `*.light`, texto `*.dark`, borda suave do `*.main`.
 *
 * ⚠️ Não usar `<Badge color="success" variant="outlined" />` cru: o Chip pinta
 * texto **e** borda com `*.main`, que na paleta semântica do ERP é pastel
 * (`success.main` = `#34D399`) — fica ilegível sobre o fundo branco da tabela.
 * A convenção do tema é `light` = fundo, `dark` = texto (ver
 * `theme/semantic-palette.ts`).
 */
export function semanticBadgeSx(tone: SemanticTone): SxProps<Theme> {
  if (tone === "neutral") {
    return {
      borderColor: "divider",
      bgcolor: "action.hover",
      color: "text.secondary",
      fontWeight: 500,
    };
  }

  return {
    borderColor: (theme) => alpha(theme.palette[tone].main, 0.35),
    bgcolor: `${tone}.light`,
    color: `${tone}.dark`,
    fontWeight: 500,
  };
}

export type SemanticBadgeProps = {
  label: string;
  tone: SemanticTone;
};

export function SemanticBadge({ label, tone }: SemanticBadgeProps) {
  return <Badge label={label} variant="outlined" sx={semanticBadgeSx(tone)} />;
}

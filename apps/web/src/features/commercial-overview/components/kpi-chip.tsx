"use client";

import type { ReactNode } from "react";
import { alpha } from "@mui/material/styles";
import { Box, Stack, Typography } from "@/ui";

export type KpiChipProps = {
  icon: ReactNode;
  label: ReactNode;
  value: ReactNode;
  /** Nota curta à direita do valor — período, régua, origem. */
  note?: ReactNode;
  /** Variação: mostra ▲/▼ e pinta conforme `up`. */
  delta?: string | null;
  up?: boolean;
  /** Destaca o chip: é o número-âncora da faixa. */
  hero?: boolean;
  /** Linha secundária, para o que qualifica o número. */
  sub?: ReactNode;
};

/**
 * Chip de KPI — ícone, rótulo, valor e uma nota que diz de onde ele vem.
 *
 * Porte do `ChipKpi` do web legado: a faixa horizontal de números do topo do
 * hub. `hero` marca o único número-âncora da faixa; se tudo é destaque, nada é.
 */
export function KpiChip({
  icon,
  label,
  value,
  note,
  delta,
  up,
  hero,
  sub,
}: KpiChipProps) {
  return (
    <Stack
      direction="row"
      spacing={1.25}
      sx={{
        alignItems: "center",
        minHeight: 62,
        px: 1.5,
        py: 1.25,
        borderRadius: 2,
        border: 1,
        borderColor: hero ? "primary.main" : "divider",
        bgcolor: (theme) =>
          hero ? alpha(theme.palette.primary.main, 0.06) : "background.paper",
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          flexShrink: 0,
          borderRadius: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: (theme) =>
            hero ? alpha(theme.palette.primary.main, 0.16) : "action.hover",
          color: hero ? "primary.main" : "text.secondary",
        }}
      >
        {icon}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            fontWeight: 600,
            display: "block",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </Typography>

        <Stack
          direction="row"
          spacing={0.75}
          sx={{ alignItems: "baseline", flexWrap: "wrap" }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.4px",
              color: hero ? "primary.main" : "text.primary",
            }}
          >
            {value}
          </Typography>

          {delta != null ? (
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: up ? "success.dark" : "error.main" }}
            >
              {up ? "▲" : "▼"} {delta.replace(/[+-]/, "")}
            </Typography>
          ) : note ? (
            <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 600 }}>
              {note}
            </Typography>
          ) : null}
        </Stack>

        {sub ? (
          <Typography
            variant="caption"
            sx={{
              color: "text.disabled",
              display: "block",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {sub}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );
}

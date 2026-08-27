"use client";

import Box from "@mui/material/Box";
import Radio from "@mui/material/Radio";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { PromotionTypeMeta } from "@/features/promotions/lib/promotion-type-catalog";

type PromotionTypeCardProps = {
  meta: PromotionTypeMeta;
  selected: boolean;
  disabled?: boolean;
};

export function PromotionTypeCard({
  meta,
  selected,
  disabled = false,
}: PromotionTypeCardProps) {
  const Icon = meta.icon;
  const inputId = `promotion-type-${meta.type}`;

  return (
    <Box
      component="label"
      htmlFor={inputId}
      aria-disabled={disabled}
      sx={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        border: 1,
        borderRadius: 2,
        // Superfície clara (evita `action.selected` / paper escuro no card)
        bgcolor: selected
          ? (theme) => alpha(theme.palette.primary.main, 0.04)
          : "common.white",
        p: 2,
        transition: "border-color 0.15s, background-color 0.15s, box-shadow 0.15s",
        borderColor: selected ? "primary.main" : "divider",
        boxShadow: selected
          ? (theme) => `0 0 0 1px ${theme.palette.primary.main}`
          : "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled && !selected ? 0.6 : 1,
        "&:hover": disabled
          ? undefined
          : {
              borderColor: (theme) =>
                selected
                  ? theme.palette.primary.main
                  : alpha(theme.palette.primary.main, 0.4),
              bgcolor: selected
                ? (theme) => alpha(theme.palette.primary.main, 0.06)
                : "muted.light",
            },
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 1.5 }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: 1,
            bgcolor: selected ? "primary.main" : "muted.main",
            color: selected ? "primary.contrastText" : "muted.contrastText",
          }}
        >
          <Icon sx={{ fontSize: 22 }} aria-hidden />
        </Box>
        <Radio
          id={inputId}
          value={meta.type}
          disabled={disabled}
          size="small"
          slotProps={{
            input: { "aria-label": meta.title },
          }}
        />
      </Stack>

      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          {meta.title}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {meta.description}
        </Typography>
      </Box>

      <Typography
        variant="caption"
        sx={{ mt: "auto", color: "text.secondary" }}
      >
        <Box component="span" sx={{ fontWeight: 500, color: "text.primary" }}>
          Como usar:{" "}
        </Box>
        {meta.howToUse}
      </Typography>
    </Box>
  );
}

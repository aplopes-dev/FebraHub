"use client";

import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { alpha } from "@mui/material/styles";
import { Avatar, Box, Stack, Typography } from "@/ui";
import type { ScoreboardRow } from "@/features/commercial-overview/services/overview.service";
import { formatCents, formatPercent } from "@/lib/money";

/**
 * Card do pódio.
 *
 * O 1º lugar ganha moldura, coroa e número maior — quem está na frente precisa
 * ser óbvio de relance, que é a graça de um pódio. Porte do `CardPodio` do web
 * legado.
 *
 * O desconto médio aparece embaixo do valor de propósito: vender dez com 30%
 * de desconto não é o mesmo que vender oito no preço, e um pódio que só ordena
 * por valor esconde exatamente isso.
 */
export function PodiumCard({
  row,
  position,
}: {
  row: ScoreboardRow;
  position: number;
}) {
  const first = position === 1;

  return (
    <Stack
      spacing={0.5}
      sx={{
        alignItems: "center",
        textAlign: "center",
        px: 1,
        py: 1.5,
        borderRadius: 2,
        border: 1,
        borderColor: first ? "primary.main" : "divider",
        bgcolor: (theme) =>
          first ? alpha(theme.palette.primary.main, 0.07) : "background.paper",
      }}
    >
      {first ? <EmojiEventsIcon sx={{ fontSize: 14, color: "primary.main" }} /> : null}

      <Box sx={{ position: "relative", lineHeight: 0 }}>
        <Avatar
          sx={{
            width: first ? 52 : 42,
            height: first ? 52 : 42,
            fontSize: first ? "1rem" : "0.8125rem",
            bgcolor: first ? "primary.main" : "action.selected",
            color: first ? "primary.contrastText" : "text.secondary",
          }}
        >
          {row.initials}
        </Avatar>
        <Box
          sx={{
            position: "absolute",
            bottom: -2,
            right: -6,
            minWidth: 18,
            height: 18,
            px: 0.5,
            borderRadius: 9,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.625rem",
            fontWeight: 700,
            border: 1,
            borderColor: first ? "primary.main" : "divider",
            bgcolor: first ? "primary.main" : "background.paper",
            color: first ? "primary.contrastText" : "text.secondary",
          }}
        >
          {position}º
        </Box>
      </Box>

      <Typography
        variant="caption"
        sx={{ fontWeight: 700, lineHeight: 1.25, mt: 0.5 }}
      >
        {row.name}
      </Typography>

      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          letterSpacing: "-0.4px",
          color: first ? "primary.main" : "text.primary",
        }}
      >
        {formatCents(row.netCents)}
      </Typography>

      <Typography variant="caption" sx={{ color: "text.disabled", lineHeight: 1.3 }}>
        {row.enrollments} matrícula{row.enrollments === 1 ? "" : "s"}
        {row.discountPercent > 0 ? ` · −${formatPercent(row.discountPercent)}` : " · sem desconto"}
      </Typography>
    </Stack>
  );
}

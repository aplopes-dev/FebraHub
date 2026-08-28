"use client";

import Link from "next/link";
import { alpha } from "@mui/material/styles";
import { Stack, Typography } from "@/ui";
import type { AttentionItem } from "@/features/commercial-overview/services/overview.service";

/**
 * Pílulas de alerta — o que está pegando fogo, logo abaixo dos números.
 *
 * O web legado põe isso no topo, e com razão: quem abre o hub de manhã precisa
 * ver o problema antes do relatório. Cada pílula leva para a tela onde aquilo
 * se resolve.
 */
export function AlertPills({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) return null;

  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
      {items.map((item) => (
        <Stack
          key={item.id}
          component={Link}
          href={item.href}
          direction="row"
          spacing={0.75}
          sx={{
            alignItems: "center",
            px: 1.5,
            py: 0.75,
            borderRadius: 999,
            textDecoration: "none",
            border: 1,
            borderColor: (theme) => alpha(theme.palette[item.tone].main, 0.35),
            bgcolor: (theme) => alpha(theme.palette[item.tone].main, 0.08),
            color: `${item.tone}.dark`,
            "&:hover": {
              bgcolor: (theme) => alpha(theme.palette[item.tone].main, 0.16),
            },
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 800 }}>
            {item.count}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {item.label.toLowerCase()}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

"use client";

import Link from "next/link";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, Paper, Stack, Typography } from "@/ui";
import type { AttentionItem } from "@/features/commercial-overview/services/overview.service";

/**
 * O bloco "precisa de atenção".
 *
 * Não é resumo: é fila de trabalho. Cada linha leva para a tela onde o
 * problema se resolve, porque indicador que não tem para onde clicar vira
 * decoração.
 */
export function AttentionList({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="body2" sx={{ color: "success.dark", fontWeight: 600 }}>
          Nada pendente no comercial.
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Sem follow-up vencido, lead órfão ou desconto travado.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={1}>
      {items.map((item) => (
        <Paper
          key={item.id}
          component={Link}
          href={item.href}
          variant="outlined"
          sx={{
            p: 1.5,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            textDecoration: "none",
            color: "inherit",
            borderLeft: 3,
            borderLeftColor: `${item.tone}.main`,
            "&:hover": { borderColor: "primary.main", borderLeftColor: `${item.tone}.main` },
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: `${item.tone}.dark`, minWidth: 36 }}
          >
            {item.count}
          </Typography>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {item.label}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {item.hint}
            </Typography>
          </Box>
          <ChevronRightIcon sx={{ fontSize: 18, color: "text.disabled" }} />
        </Paper>
      ))}
    </Stack>
  );
}

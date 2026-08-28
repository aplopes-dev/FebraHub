"use client";

import { Avatar, Box, Stack, Typography } from "@/ui";
import { PodiumCard } from "@/features/commercial-overview/components/podium-card";
import type { ScoreboardRow } from "@/features/commercial-overview/services/overview.service";
import { formatCents, formatCentsCompact, formatPercent } from "@/lib/money";

/**
 * Consultores do mês: pódio para os três primeiros, lista para o resto.
 *
 * A ordem é por **valor praticado**, e o desconto médio anda junto — é o que
 * separa quem vendeu bem de quem vendeu barato. Porte do bloco de consultoras
 * do web legado.
 */
export function TeamScoreboard({ rows }: { rows: ScoreboardRow[] }) {
  if (rows.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Nenhuma venda registrada no mês.
      </Typography>
    );
  }

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const best = rows[0]?.netCents ?? 0;

  return (
    <Stack spacing={1.5}>
      <Box
        sx={{
          display: "grid",
          gap: 1,
          gridTemplateColumns: `repeat(${Math.min(Math.max(podium.length, 1), 3)}, minmax(0, 1fr))`,
        }}
      >
        {podium.map((row, index) => (
          <PodiumCard key={row.consultantId} row={row} position={index + 1} />
        ))}
      </Box>

      {rest.length > 0 ? (
        <Stack spacing={0.75}>
          {rest.map((row, index) => (
            <Stack
              key={row.consultantId}
              direction="row"
              spacing={1}
              sx={{ alignItems: "center" }}
            >
              <Typography
                variant="caption"
                sx={{ width: 14, color: "text.disabled", fontWeight: 700 }}
              >
                {index + 4}
              </Typography>
              <Avatar sx={{ width: 24, height: 24, fontSize: "0.625rem" }}>
                {row.initials}
              </Avatar>

              <Stack sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 600 }} noWrap>
                  {row.name}
                </Typography>
                <Box
                  sx={{
                    mt: 0.5,
                    height: 3,
                    borderRadius: 2,
                    bgcolor: "action.hover",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width: best > 0 ? `${Math.round((row.netCents / best) * 100)}%` : "0%",
                      height: "100%",
                      bgcolor: "action.selected",
                    }}
                  />
                </Box>
              </Stack>

              <Stack sx={{ alignItems: "flex-end" }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {formatCents(row.netCents)}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.disabled" }}>
                  {row.openCount} em aberto ({formatCentsCompact(row.openCents)})
                </Typography>
              </Stack>
            </Stack>
          ))}
        </Stack>
      ) : null}

      <Typography variant="caption" sx={{ color: "text.disabled" }}>
        Ordenado por valor praticado no mês. O percentual embaixo do card é o
        desconto médio dado — {formatPercent(rows[0]?.discountPercent ?? 0)} no líder.
      </Typography>
    </Stack>
  );
}

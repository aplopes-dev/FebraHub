"use client";

import { Box, Paper, Stack, Typography } from "@/ui";
import type { roomCounters } from "@/lib/mock-db";
import { formatPercent } from "@/lib/money";

type Counters = ReturnType<typeof roomCounters>;

/**
 * O placar da sala, ao vivo.
 *
 * A conversão fica ao lado dos absolutos de propósito: sete matrículas parece
 * bom até aparecer que havia oitenta pessoas na sala. É esse contraste que faz
 * o time mudar de atitude ainda durante o evento.
 */
export function RoomCountersBar({ counters }: { counters: Counters }) {
  const pending = Math.max(0, counters.checkedIn - counters.approached);

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack
        direction="row"
        spacing={{ xs: 2, md: 4 }}
        sx={{ flexWrap: "wrap", rowGap: 2 }}
      >
        <Counter label="Na sala" value={counters.checkedIn} />
        <Counter label="Esperados" value={counters.expected} tone="text.secondary" />
        <Counter label="Abordados" value={counters.approached} />
        <Counter label="A abordar" value={pending} tone="warning.dark" />
        <Counter label="Matrículas" value={counters.enrolled} tone="success.dark" />
        <Counter label="Vão pensar" value={counters.thinking} tone="warning.dark" />
        <Counter label="Recusaram" value={counters.refused} tone="error.dark" />

        <Stack spacing={0.5} sx={{ minWidth: 180, flex: 1 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between" }}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Conversão da sala
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {formatPercent(counters.conversionPercent)}
            </Typography>
          </Stack>
          <Box sx={{ height: 6, borderRadius: 3, bgcolor: "action.hover", overflow: "hidden" }}>
            <Box
              sx={{
                width: `${Math.min(100, counters.conversionPercent * 4)}%`,
                height: "100%",
                bgcolor: "success.main",
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            {counters.enrolled} de {counters.checkedIn} presentes · presença de{" "}
            {formatPercent(counters.attendancePercent)}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

function Counter({
  label,
  value,
  tone = "text.primary",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <Stack spacing={0}>
      <Typography variant="h5" sx={{ fontWeight: 700, color: tone, lineHeight: 1.15 }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
    </Stack>
  );
}

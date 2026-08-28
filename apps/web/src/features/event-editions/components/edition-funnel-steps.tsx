"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Box, Paper, Stack, Typography } from "@/ui";
import type { EditionFunnel } from "@/features/event-editions/types/edition-view";
import { formatPercent } from "@/lib/money";

/**
 * O funil da edição.
 *
 * A conversão que interessa é a do **evento inteiro**, degrau a degrau: quanto
 * do ingresso virou presença, quanto da presença virou conversa e quanto da
 * conversa virou matrícula. Ver só o número final esconde onde a escada quebra.
 */
export function EditionFunnelSteps({ funnel }: { funnel: EditionFunnel }) {
  const steps = [
    { label: "Ingressos", value: funnel.tickets, rate: undefined },
    { label: "Presentes", value: funnel.checkedIn, rate: funnel.attendancePercent },
    { label: "Abordados", value: funnel.approached, rate: funnel.approachPercent },
    { label: "Matrículas", value: funnel.enrolled, rate: funnel.conversionPercent },
  ];

  return (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", alignItems: "stretch" }}>
      {steps.map((step, index) => (
        <Stack key={step.label} direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, minWidth: 132 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {step.value}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {step.label}
            </Typography>
            {step.rate !== undefined ? (
              <Typography
                variant="caption"
                sx={{ display: "block", color: "text.disabled" }}
              >
                {formatPercent(step.rate)} do passo anterior
              </Typography>
            ) : null}
          </Paper>
          {index < steps.length - 1 ? (
            <Box sx={{ display: "flex", color: "text.disabled" }}>
              <ArrowForwardIcon sx={{ fontSize: 16 }} />
            </Box>
          ) : null}
        </Stack>
      ))}
    </Stack>
  );
}

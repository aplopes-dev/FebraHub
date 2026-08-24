"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { Typography } from "@citybox/mui";
import { surfaceBorderRadius } from "@/theme/surface-styles";
import type { FiscalDocumentSummary } from "@/features/facilita-nfe/types/fiscal-document";

type FacilitaNfeSummaryCardsProps = {
  summary: FiscalDocumentSummary;
};

/**
 * Os 5 cards do mockup (FR-003). "Manifestações finais" e "Não manifestadas"
 * são conceitos de manifestação do destinatário — aplicam-se a documentos
 * *recebidos*, não emitidos — então ficam sempre zerados e marcados como não
 * aplicáveis nesta aba (ver `spec.md` `## Clarifications`, sessão 2026-08-09,
 * e `research.md` §3.3). Mantidos por fidelidade visual ao mockup, sem gerar
 * nenhuma chamada de API.
 */
export function FacilitaNfeSummaryCards({ summary }: FacilitaNfeSummaryCardsProps) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ flexWrap: "wrap", justifyContent: { xs: "flex-start", lg: "flex-end" } }}
    >
      <SummaryCard label="Total" value={summary.total} />
      <SummaryCard label="Autorizadas" value={summary.authorized} tone="success" />
      <SummaryCard label="Canceladas" value={summary.cancelled} tone="error" />
      <SummaryCard
        label="Manifestações finais"
        value={0}
        disabledHint="Não se aplica a documentos emitidos pela loja — só a documentos recebidos."
      />
      <SummaryCard
        label="Não manifestadas"
        value={0}
        disabledHint="Não se aplica a documentos emitidos pela loja — só a documentos recebidos."
      />
    </Stack>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  disabledHint,
}: {
  label: string;
  value: number;
  tone?: "success" | "error";
  disabledHint?: string;
}) {
  const color = tone === "success" ? "success.main" : tone === "error" ? "error.main" : "text.primary";

  const card = (
    <Paper
      variant="outlined"
      sx={{
        minWidth: 148,
        px: 2,
        py: 1.25,
        borderRadius: surfaceBorderRadius,
        bgcolor: "background.paper",
        opacity: disabledHint ? 0.55 : 1,
      }}
    >
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography
        variant="h6"
        sx={{ mt: 0.5, fontWeight: 700, fontVariantNumeric: "tabular-nums", color }}
      >
        {value}
      </Typography>
    </Paper>
  );

  if (!disabledHint) return card;

  return (
    <Tooltip title={disabledHint} arrow>
      <Box>{card}</Box>
    </Tooltip>
  );
}

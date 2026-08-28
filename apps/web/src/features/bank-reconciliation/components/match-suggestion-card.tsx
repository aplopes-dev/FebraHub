"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Button, Typography } from "@/ui";
import {
  formatCurrencyBRL,
  formatIsoDateBR,
} from "@/features/bank-reconciliation/lib/bank-statement-format";
import type { MatchSuggestionResult } from "@/features/bank-reconciliation/types/bank-statement";

type MatchSuggestionCardProps = {
  suggestion: MatchSuggestionResult | undefined;
  isLoading: boolean;
  onReconcile: (financialEntryId: string) => void;
  isReconciling: boolean;
};

export function MatchSuggestionCard({
  suggestion,
  isLoading,
  onReconcile,
  isReconciling,
}: MatchSuggestionCardProps) {
  if (isLoading || !suggestion) {
    return (
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        Buscando sugestão…
      </Typography>
    );
  }

  if (suggestion.kind === "none") {
    return (
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        Nenhum lançamento correspondente encontrado.
      </Typography>
    );
  }

  // `value_divergence` é sinalizado no cabeçalho do próprio cartão da transação
  // (FR-031/FR-039, research.md D18) — renderizar aqui também duplicaria o aviso.
  if (suggestion.kind === "value_divergence") {
    return null;
  }

  return (
    <Stack spacing={1}>
      {suggestion.candidates.map((candidate) => (
        <Box
          key={candidate.financialEntryId}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            borderRadius: 1,
            px: 1.5,
            py: 1,
          }}
        >
          <Stack spacing={0}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {candidate.description || "Lançamento sem descrição"}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {formatCurrencyBRL(candidate.openBalance)} · vence em{" "}
              {formatIsoDateBR(candidate.dueDate)}
            </Typography>
          </Stack>
          <Button
            variant="contained"
            size="small"
            disabled={isReconciling}
            onClick={() => onReconcile(candidate.financialEntryId)}
          >
            Conciliar
          </Button>
        </Box>
      ))}
    </Stack>
  );
}

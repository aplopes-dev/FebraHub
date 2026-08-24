"use client";

import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { Typography } from "@citybox/mui";
import { FinancialResultGroupRow } from "@/features/financial-results/components/financial-result-group-row";
import type { ResultGroupBlock } from "@/features/financial-results/types/financial-result";
import { surfaceBorderRadius } from "@/theme/surface-styles";

type FinancialResultSectionProps = {
  groups: ResultGroupBlock[];
  expandedGroupIds: Set<string>;
  onToggleGroup: (groupId: string) => void;
};

/**
 * Árvore dos 9 grupos fixos do modelo DRE (spec `007-financeiro-ajustes-ui`
 * US5) — sempre nos 9, na ordem do catálogo, mesmo com `total: 0`. Substitui
 * as duas seções Receitas/Despesas anteriores por uma lista única (cada
 * grupo já carrega seu próprio `sign`).
 */
export function FinancialResultSection({
  groups,
  expandedGroupIds,
  onToggleGroup,
}: FinancialResultSectionProps) {
  return (
    <Paper
      component="section"
      variant="outlined"
      sx={{ borderRadius: surfaceBorderRadius, overflow: "hidden", bgcolor: "background.paper" }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Grupos financeiros
        </Typography>
      </Stack>

      <Box sx={{ "& > * + *": { borderTop: 1, borderColor: "divider" } }}>
        {groups.map((group) => (
          <FinancialResultGroupRow
            key={group.groupId}
            group={group}
            expanded={expandedGroupIds.has(group.groupId)}
            onToggle={onToggleGroup}
          />
        ))}
      </Box>
    </Paper>
  );
}

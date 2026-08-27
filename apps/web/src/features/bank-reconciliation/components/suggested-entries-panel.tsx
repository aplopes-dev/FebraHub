"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Button, Typography } from "@/ui";
import { useAllSuggestionsQueries } from "@/features/bank-reconciliation/hooks/use-bank-statement-queries";
import { useReconcileTransactionMutation } from "@/features/bank-reconciliation/hooks/use-bank-reconciliation-mutations";
import { formatCurrencyBRL, formatIsoDateBR } from "@/features/bank-reconciliation/lib/bank-statement-format";
import type { BankStatementTransaction } from "@/features/bank-reconciliation/types/bank-statement";

type SuggestedEntriesPanelProps = {
  bankStatementId: string;
  transactions: BankStatementTransaction[];
};

/**
 * Painel colapsável "Registros sugeridos" no rodapé da aba Pendentes
 * (FR-041) — consolida as sugestões automáticas já calculadas para cada
 * cartão, com uma ação "Adicionar" equivalente a Conciliar (FR-015). A
 * mesma sugestão continua aparecendo também embutida no cartão da
 * transação (FR-039) — confirmar por qualquer um dos dois lugares produz o
 * mesmo resultado.
 */
export function SuggestedEntriesPanel({ bankStatementId, transactions }: SuggestedEntriesPanelProps) {
  const [open, setOpen] = useState(true);
  const reconcileMutation = useReconcileTransactionMutation();
  const suggestionQueries = useAllSuggestionsQueries(
    bankStatementId,
    transactions.map((transaction) => transaction.id),
  );

  const items = transactions.flatMap((transaction, index) => {
    const suggestion = suggestionQueries[index]?.data;
    if (!suggestion || suggestion.kind !== "exact") return [];
    return suggestion.candidates.map((candidate) => ({
      transactionId: transaction.id,
      transactionMemo: transaction.memo,
      ...candidate,
    }));
  });

  if (items.length === 0) return null;

  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5 }}
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Registros sugeridos
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Registros correspondentes encontrados automaticamente. Verifique os detalhes antes de
            conciliar.
          </Typography>
        </Box>
        <IconButton size="small" onClick={() => setOpen((prev) => !prev)}>
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Stack>
      <Collapse in={open}>
        <Stack spacing={1} sx={{ px: 2, pb: 2 }}>
          {items.map((item) => (
            <Stack
              key={`${item.transactionId}-${item.financialEntryId}`}
              direction="row"
              spacing={2}
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                px: 1.5,
                py: 1,
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ minWidth: 160 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                  {item.description || "Lançamento sem descrição"}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  vence em {formatIsoDateBR(item.dueDate)}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatCurrencyBRL(item.openBalance)}
              </Typography>
              <Button
                type="button"
                variant="outlined"
                size="small"
                disabled={reconcileMutation.isPending}
                onClick={() =>
                  reconcileMutation.mutate({
                    bankStatementId,
                    transactionId: item.transactionId,
                    financialEntryIds: [item.financialEntryId],
                  })
                }
              >
                Adicionar
              </Button>
            </Stack>
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
}

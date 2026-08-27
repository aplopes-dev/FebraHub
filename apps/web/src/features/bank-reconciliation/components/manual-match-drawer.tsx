"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Button, Drawer, ScrollArea, Stack, Typography } from "@/ui";
import { useEligibleEntriesSearch } from "@/features/bank-reconciliation/hooks/use-eligible-entries-search";
import { ManualMatchFilters } from "@/features/bank-reconciliation/components/manual-match-filters";
import { formatCurrencyBRL, formatIsoDateBR } from "@/features/bank-reconciliation/lib/bank-statement-format";
import type { EligibleEntry } from "@/features/bank-reconciliation/types/bank-statement";

type ManualMatchDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankStatementId: string;
  transactionId: string;
  bankAccountLabel: string;
  transactionAmount: number;
  onConfirm: (financialEntryIds: string[]) => void;
  isConfirming: boolean;
};

/**
 * "Buscar Registros" (US3/US4, FR-016/017/036/037/038, research.md D17) —
 * filtros completos + tabela de resultados, seleção múltipla via
 * `Set<string>`. Cobre tanto a busca manual (1 selecionado) quanto a soma de
 * N lançamentos (2+ selecionados): o servidor exige que a soma dos valores
 * elegíveis selecionados feche exatamente com o valor da transação em ambos
 * os casos.
 *
 * O rodapé é um totalizador **neutro** (selecionado / transação / diferença),
 * sem cor semântica: é feedback mecânico para montar uma soma exata (FR-017),
 * não um veredito. O alerta de divergência vive no cartão da transação
 * (FR-016/FR-031/FR-039, research.md D18) — não aqui, no momento da escolha.
 */
export function ManualMatchDrawer({
  open,
  onOpenChange,
  bankStatementId,
  transactionId,
  bankAccountLabel,
  transactionAmount,
  onConfirm,
  isConfirming,
}: ManualMatchDrawerProps) {
  return (
    <Drawer open={open} onClose={() => onOpenChange(false)} title="Buscar Registros" width={640}>
      <ManualMatchDrawerBody
        key={open ? "open" : "closed"}
        bankStatementId={bankStatementId}
        transactionId={transactionId}
        bankAccountLabel={bankAccountLabel}
        transactionAmount={transactionAmount}
        onClose={() => onOpenChange(false)}
        onConfirm={onConfirm}
        isConfirming={isConfirming}
      />
    </Drawer>
  );
}

function ManualMatchDrawerBody({
  bankStatementId,
  transactionId,
  bankAccountLabel,
  transactionAmount,
  onClose,
  onConfirm,
  isConfirming,
}: {
  bankStatementId: string;
  transactionId: string;
  bankAccountLabel: string;
  transactionAmount: number;
  onClose: () => void;
  onConfirm: (financialEntryIds: string[]) => void;
  isConfirming: boolean;
}) {
  const { filters, setFilters, results, isLoading } = useEligibleEntriesSearch(
    bankStatementId,
    transactionId,
    true,
  );
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    if (selectedIds.size === 0) return;
    onConfirm([...selectedIds]);
  }

  const selectedEntries = results.filter((entry) => selectedIds.has(entry.financialEntryId));
  const selectedSum = selectedEntries.reduce((sum, entry) => sum + entry.eligibleAmount, 0);
  const difference = transactionAmount - selectedSum;
  const sumMatches = selectedIds.size > 0 && Math.abs(difference) <= 0.001;

  return (
    <Stack spacing={2} sx={{ height: "100%", minHeight: 0 }}>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Selecione um ou mais lançamentos. A soma dos valores selecionados precisa fechar
        exatamente com o valor da transação ({formatCurrencyBRL(transactionAmount)}).
      </Typography>

      <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", px: 2, py: 1 }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Filtros de busca
          </Typography>
          <IconButton size="small" onClick={() => setFiltersOpen((prev) => !prev)}>
            {filtersOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        </Stack>
        <Collapse in={filtersOpen}>
          <Box sx={{ px: 2, pb: 2 }}>
            <ManualMatchFilters
              bankAccountLabel={bankAccountLabel}
              value={filters}
              onChange={setFilters}
            />
          </Box>
        </Collapse>
      </Box>

      <ScrollArea sx={{ flex: 1, minHeight: 0, borderTop: 1, borderColor: "divider" }}>
        {isLoading ? (
          <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", py: 5 }}>
            Buscando…
          </Typography>
        ) : null}
        {!isLoading && results.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", textAlign: "center", py: 5, px: 2 }}
          >
            Sem dados no momento.
          </Typography>
        ) : null}
        {!isLoading && results.length > 0 ? (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" />
                <TableCell>Vencimento</TableCell>
                <TableCell>Pagamento</TableCell>
                <TableCell>Competência</TableCell>
                <TableCell>Descrição / Categoria</TableCell>
                <TableCell align="right">Valor</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((entry) => (
                <EligibleEntryRow
                  key={entry.financialEntryId}
                  entry={entry}
                  selected={selectedIds.has(entry.financialEntryId)}
                  onToggle={() => toggle(entry.financialEntryId)}
                />
              ))}
            </TableBody>
          </Table>
        ) : null}
      </ScrollArea>

      <Stack spacing={1}>
        {selectedIds.size > 0 ? (
          <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Selecionados ({selectedIds.size}): {formatCurrencyBRL(selectedSum)} · Transação:{" "}
              {formatCurrencyBRL(transactionAmount)}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>
              Diferença: {formatCurrencyBRL(difference)}
            </Typography>
          </Stack>
        ) : null}
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Button type="button" variant="outlined" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="contained"
            disabled={selectedIds.size === 0 || !sumMatches || isConfirming}
            loading={isConfirming}
            onClick={handleConfirm}
          >
            Conciliar
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}

type EligibleEntryRowProps = {
  entry: EligibleEntry;
  selected: boolean;
  onToggle: () => void;
};

function EligibleEntryRow({ entry, selected, onToggle }: EligibleEntryRowProps) {
  return (
    <TableRow hover selected={selected} onClick={onToggle} sx={{ cursor: "pointer" }}>
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onChange={onToggle} onClick={(event) => event.stopPropagation()} />
      </TableCell>
      <TableCell>{formatIsoDateBR(entry.dueDate)}</TableCell>
      <TableCell>{entry.paidAt ? formatIsoDateBR(entry.paidAt) : "—"}</TableCell>
      <TableCell>{formatIsoDateBR(entry.competenceDate)}</TableCell>
      <TableCell>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {entry.description || "Lançamento sem descrição"}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {entry.categoryName || "Sem categoria"}
        </Typography>
      </TableCell>
      <TableCell align="right" sx={{ fontWeight: 600 }}>
        {formatCurrencyBRL(entry.eligibleAmount)}
      </TableCell>
    </TableRow>
  );
}

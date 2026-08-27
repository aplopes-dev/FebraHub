"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { DateRangePicker, SearchInput, Typography, type DateRange } from "@/ui";
import { ListLoadErrorAlert } from "@/components/ui/list-page";
import { TransactionCard } from "@/features/bank-reconciliation/components/transaction-card";
import { SuggestedEntriesPanel } from "@/features/bank-reconciliation/components/suggested-entries-panel";
import { useBankStatementTransactionList } from "@/features/bank-reconciliation/hooks/use-bank-statement-transaction-list";
import type { BankStatementTransactionStatus } from "@/features/bank-reconciliation/types/bank-statement";

type TransactionListPanelProps = {
  bankStatementId: string;
  /** `null` quando o extrato não tem conta bancária resolvida (US7,
   *  spec `007-financeiro-ajustes-ui`) — desabilita busca manual/criar
   *  lançamento nessa linha, já que não há conta para elegibilidade. */
  bankAccountId: string | null;
  /** Exibida como a conta travada dentro do drawer "Buscar Registros" (FR-037). */
  bankAccountLabel: string;
  status: BankStatementTransactionStatus;
};

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function periodToDateRange(
  postedFrom: string | undefined,
  postedTo: string | undefined,
): DateRange | undefined {
  if (!postedFrom && !postedTo) return undefined;
  return {
    from: postedFrom ? new Date(`${postedFrom}T00:00:00`) : undefined,
    to: postedTo ? new Date(`${postedTo}T00:00:00`) : undefined,
  };
}

/** Sempre montado com `key={status}` pelo pai — ver nota em
 *  `use-bank-statement-transaction-list.ts`. */
export function TransactionListPanel({
  bankStatementId,
  bankAccountId,
  bankAccountLabel,
  status,
}: TransactionListPanelProps) {
  const {
    search,
    setSearch,
    postedFrom,
    postedTo,
    setPeriod,
    result,
    isLoading,
    isError,
    refresh,
  } = useBankStatementTransactionList(bankStatementId, status);

  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ flexWrap: "wrap" }}>
        <Box sx={{ minWidth: 240 }}>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Período
          </Typography>
          <DateRangePicker
            size="small"
            value={periodToDateRange(postedFrom, postedTo)}
            onChange={(range) =>
              setPeriod(
                range?.from ? toIsoDate(range.from) : undefined,
                range?.to ? toIsoDate(range.to) : undefined,
              )
            }
          />
        </Box>
        <SearchInput
          size="small"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por descrição…"
          sx={{ maxWidth: 320, alignSelf: "flex-end" }}
        />
      </Stack>
      {isError ? (
        <ListLoadErrorAlert
          title="Não foi possível carregar as transações"
          message="Tente novamente."
          onRetry={refresh}
        />
      ) : null}
      {!isError && !isLoading && result.data.length === 0 ? (
        <Stack sx={{ py: 4, alignItems: "center", color: "text.secondary" }}>
          Nenhuma transação nesta aba.
        </Stack>
      ) : null}
      {!isError
        ? result.data.map((transaction) => (
            <TransactionCard
              key={transaction.id}
              bankStatementId={bankStatementId}
              bankAccountId={bankAccountId}
              bankAccountLabel={bankAccountLabel}
              transaction={transaction}
            />
          ))
        : null}
      {!isError && status === "pending" && result.data.length > 0 ? (
        <SuggestedEntriesPanel bankStatementId={bankStatementId} transactions={result.data} />
      ) : null}
    </Stack>
  );
}

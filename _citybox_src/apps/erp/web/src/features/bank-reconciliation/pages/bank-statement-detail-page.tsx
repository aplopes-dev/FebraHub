"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { PageHeader } from "@citybox/mui";
import { ListLoadErrorAlert, ListPageShell } from "@/components/ui/list-page";
import { StatementHeaderCard } from "@/features/bank-reconciliation/components/statement-header-card";
import { TransactionListPanel } from "@/features/bank-reconciliation/components/transaction-list-panel";
import { TransactionTabs } from "@/features/bank-reconciliation/components/transaction-tabs";
import { useBankStatementQuery } from "@/features/bank-reconciliation/hooks/use-bank-statement-queries";
import type { BankStatementTransactionStatus } from "@/features/bank-reconciliation/types/bank-statement";

type BankStatementDetailPageProps = {
  bankStatementId: string;
};

export function BankStatementDetailPage({ bankStatementId }: BankStatementDetailPageProps) {
  const { data: bankStatement, isLoading, isError, refetch } =
    useBankStatementQuery(bankStatementId);
  const [tab, setTab] = useState<BankStatementTransactionStatus>("pending");

  return (
    <ListPageShell>
      <PageHeader sx={{ flexShrink: 0, mb: 0 }} title="Extrato bancário" />
      {isError ? (
        <ListLoadErrorAlert
          title="Não foi possível carregar o extrato"
          message="Tente novamente."
          onRetry={() => void refetch()}
        />
      ) : null}
      {!isError && bankStatement ? (
        <Stack spacing={2.5}>
          <StatementHeaderCard bankStatement={bankStatement} />
          <Box>
            <TransactionTabs value={tab} onValueChange={setTab} counts={bankStatement.counts} />
            <Box sx={{ pt: 2 }}>
              {/* `key={tab}` reseta página/busca ao trocar de aba de propósito
                  (ver use-bank-statement-transaction-list.ts). */}
              <TransactionListPanel
                key={tab}
                bankStatementId={bankStatementId}
                bankAccountId={bankStatement.bankAccountId || null}
                bankAccountLabel={`${bankStatement.bankName} · ${bankStatement.accountNumber}`}
                status={tab}
              />
            </Box>
          </Box>
        </Stack>
      ) : null}
      {!isError && !bankStatement && isLoading ? (
        <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>Carregando…</Box>
      ) : null}
    </ListPageShell>
  );
}

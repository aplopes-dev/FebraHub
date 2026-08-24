"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Tab, Tabs } from "@citybox/mui";
import { BANK_STATEMENT_TRANSACTION_TAB_LABELS } from "@/features/bank-reconciliation/lib/bank-statement-format";
import type {
  BankStatementCounts,
  BankStatementTransactionStatus,
} from "@/features/bank-reconciliation/types/bank-statement";

const TABS: BankStatementTransactionStatus[] = ["pending", "reconciled", "discarded"];

type TransactionTabsProps = {
  value: BankStatementTransactionStatus;
  onValueChange: (tab: BankStatementTransactionStatus) => void;
  counts: BankStatementCounts;
};

export function TransactionTabs({ value, onValueChange, counts }: TransactionTabsProps) {
  const countByTab: Record<BankStatementTransactionStatus, number> = {
    pending: counts.pending,
    reconciled: counts.reconciled,
    discarded: counts.discarded,
  };

  return (
    <Tabs
      value={value}
      onChange={(_, next: BankStatementTransactionStatus) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      {TABS.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box component="span">{BANK_STATEMENT_TRANSACTION_TAB_LABELS[tab]}</Box>
              <Badge
                label={countByTab[tab]}
                color="muted"
                sx={{ height: 20, "& .MuiChip-label": { px: 0.75, fontSize: "0.75rem" } }}
              />
            </Stack>
          }
          sx={{ minHeight: 44, textTransform: "none", fontWeight: 500 }}
        />
      ))}
    </Tabs>
  );
}

"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Tab, Tabs } from "@citybox/mui";
import {
  FINANCIAL_ENTRY_LIST_TABS,
  FINANCIAL_ENTRY_TAB_LABELS,
  type FinancialEntryListTab,
  type FinancialEntryTabCounts,
} from "@/features/financial-entries/types/financial-entry";

type FinancialEntryListTabsProps = {
  value: FinancialEntryListTab;
  onValueChange: (tab: FinancialEntryListTab) => void;
  counts: FinancialEntryTabCounts;
};

export function FinancialEntryListTabs({
  value,
  onValueChange,
  counts,
}: FinancialEntryListTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: FinancialEntryListTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      {FINANCIAL_ENTRY_LIST_TABS.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box component="span">{FINANCIAL_ENTRY_TAB_LABELS[tab]}</Box>
              <Badge
                label={counts[tab]}
                color="muted"
                sx={{
                  height: 20,
                  "& .MuiChip-label": { px: 0.75, fontSize: "0.75rem" },
                }}
              />
            </Stack>
          }
          sx={{ minHeight: 44, textTransform: "none", fontWeight: 500 }}
        />
      ))}
    </Tabs>
  );
}

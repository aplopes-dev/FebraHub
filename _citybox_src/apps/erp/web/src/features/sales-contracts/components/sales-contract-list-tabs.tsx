"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Tab, Tabs } from "@citybox/mui";
import {
  SALES_CONTRACT_TAB_LABELS,
  SALES_CONTRACT_TAB_ORDER,
} from "@/features/sales-contracts/lib/sales-contract-tabs";
import type {
  SalesContractListTab,
  SalesContractTabCounts,
} from "@/features/sales-contracts/types/sales-contract";

type SalesContractListTabsProps = {
  value: SalesContractListTab;
  onValueChange: (tab: SalesContractListTab) => void;
  counts: SalesContractTabCounts;
};

export function SalesContractListTabs({
  value,
  onValueChange,
  counts,
}: SalesContractListTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: SalesContractListTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      {SALES_CONTRACT_TAB_ORDER.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box component="span">{SALES_CONTRACT_TAB_LABELS[tab]}</Box>
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
          sx={{
            minHeight: 44,
            textTransform: "none",
            fontWeight: 500,
          }}
        />
      ))}
    </Tabs>
  );
}

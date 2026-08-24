"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Tab, Tabs } from "@citybox/mui";
import {
  FINANCIAL_GROUP_TAB_LABELS,
  FINANCIAL_GROUP_TAB_ORDER,
  type FinancialGroupListTab,
  type FinancialGroupTabCounts,
} from "@/features/financial-groups/types/financial-group";

type FinancialGroupListTabsProps = {
  value: FinancialGroupListTab;
  onValueChange: (tab: FinancialGroupListTab) => void;
  counts: FinancialGroupTabCounts;
};

export function FinancialGroupListTabs({
  value,
  onValueChange,
  counts,
}: FinancialGroupListTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: FinancialGroupListTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      {FINANCIAL_GROUP_TAB_ORDER.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box component="span">{FINANCIAL_GROUP_TAB_LABELS[tab]}</Box>
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

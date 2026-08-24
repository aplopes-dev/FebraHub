"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Tab, Tabs } from "@citybox/mui";
import {
  CHART_OF_ACCOUNT_TAB_LABELS,
  CHART_OF_ACCOUNT_TAB_ORDER,
  type ChartOfAccountListTab,
  type ChartOfAccountTabCounts,
} from "@/features/chart-of-accounts/types/chart-of-account";

type ChartOfAccountListTabsProps = {
  value: ChartOfAccountListTab;
  onValueChange: (tab: ChartOfAccountListTab) => void;
  counts: ChartOfAccountTabCounts;
};

export function ChartOfAccountListTabs({
  value,
  onValueChange,
  counts,
}: ChartOfAccountListTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: ChartOfAccountListTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      {CHART_OF_ACCOUNT_TAB_ORDER.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box component="span">{CHART_OF_ACCOUNT_TAB_LABELS[tab]}</Box>
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

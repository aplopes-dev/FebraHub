"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Tab, Tabs } from "@/ui";
import {
  COST_CENTER_TAB_LABELS,
  COST_CENTER_TAB_ORDER,
  type CostCenterListTab,
  type CostCenterTabCounts,
} from "@/features/cost-centers/types/cost-center";

type CostCenterListTabsProps = {
  value: CostCenterListTab;
  onValueChange: (tab: CostCenterListTab) => void;
  counts: CostCenterTabCounts;
};

export function CostCenterListTabs({
  value,
  onValueChange,
  counts,
}: CostCenterListTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: CostCenterListTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      {COST_CENTER_TAB_ORDER.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box component="span">{COST_CENTER_TAB_LABELS[tab]}</Box>
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

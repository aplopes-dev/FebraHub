"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Tab, Tabs } from "@/ui";
import {
  STOCK_MOVEMENT_TAB_LABELS,
  STOCK_MOVEMENT_TAB_ORDER,
  type StockMovementListTab,
  type StockMovementTabCounts,
} from "@/features/stock-movements/types/stock-movement";

type StockMovementListTabsProps = {
  value: StockMovementListTab;
  onValueChange: (tab: StockMovementListTab) => void;
  counts: StockMovementTabCounts;
};

export function StockMovementListTabs({
  value,
  onValueChange,
  counts,
}: StockMovementListTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: StockMovementListTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      {STOCK_MOVEMENT_TAB_ORDER.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box component="span">{STOCK_MOVEMENT_TAB_LABELS[tab]}</Box>
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

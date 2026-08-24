"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Tab, Tabs } from "@citybox/mui";
import {
  STOCK_TRANSFER_TAB_LABELS,
  STOCK_TRANSFER_TAB_ORDER,
  type StockTransferListTab,
  type StockTransferTabCounts,
} from "@/features/stock-transfers/types/stock-transfer";

type StockTransferListTabsProps = {
  value: StockTransferListTab;
  onValueChange: (tab: StockTransferListTab) => void;
  counts: StockTransferTabCounts;
};

export function StockTransferListTabs({
  value,
  onValueChange,
  counts,
}: StockTransferListTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: StockTransferListTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      {STOCK_TRANSFER_TAB_ORDER.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box component="span">{STOCK_TRANSFER_TAB_LABELS[tab]}</Box>
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

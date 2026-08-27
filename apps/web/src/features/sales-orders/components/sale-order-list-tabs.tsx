"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Tab, Tabs } from "@/ui";
import {
  SALE_ORDER_TAB_LABELS,
  SALE_ORDER_TAB_ORDER,
} from "@/features/sales-orders/lib/sale-order-tabs";
import type {
  SaleOrderListTab,
  SaleOrderTabCounts,
} from "@/features/sales-orders/types/sale-order";

type SaleOrderListTabsProps = {
  value: SaleOrderListTab;
  onValueChange: (tab: SaleOrderListTab) => void;
  counts: SaleOrderTabCounts;
};

export function SaleOrderListTabs({
  value,
  onValueChange,
  counts,
}: SaleOrderListTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: SaleOrderListTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      {SALE_ORDER_TAB_ORDER.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center" }}
            >
              <Box component="span">{SALE_ORDER_TAB_LABELS[tab]}</Box>
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

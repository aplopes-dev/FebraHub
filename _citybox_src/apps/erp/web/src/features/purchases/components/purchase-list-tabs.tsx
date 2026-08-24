"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Tab, Tabs } from "@citybox/mui";
import {
  PURCHASE_TAB_LABELS,
  PURCHASE_TAB_ORDER,
  type PurchaseListTab,
  type PurchaseTabCounts,
} from "@/features/purchases/types/purchase";

type PurchaseListTabsProps = {
  value: PurchaseListTab;
  onValueChange: (tab: PurchaseListTab) => void;
  counts: PurchaseTabCounts;
};

export function PurchaseListTabs({
  value,
  onValueChange,
  counts,
}: PurchaseListTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: PurchaseListTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      {PURCHASE_TAB_ORDER.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box component="span">{PURCHASE_TAB_LABELS[tab]}</Box>
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

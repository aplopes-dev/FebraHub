"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Tab, Tabs } from "@/ui";
import {
  SUPPLIER_TAB_LABELS,
  SUPPLIER_TAB_ORDER,
  type SupplierListTab,
  type SupplierTabCounts,
} from "@/features/suppliers/types/supplier";

type SupplierListTabsProps = {
  value: SupplierListTab;
  onValueChange: (tab: SupplierListTab) => void;
  counts: SupplierTabCounts;
};

export function SupplierListTabs({
  value,
  onValueChange,
  counts,
}: SupplierListTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: SupplierListTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      {SUPPLIER_TAB_ORDER.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box component="span">{SUPPLIER_TAB_LABELS[tab]}</Box>
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

"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Tab, Tabs } from "@/ui";
import {
  PRODUCT_TAB_LABELS,
  PRODUCT_TAB_ORDER,
} from "@/features/products/lib/product-tabs";
import type {
  ProductListTab,
  ProductTabCounts,
} from "@/features/products/types/product";

type ProductListTabsProps = {
  value: ProductListTab;
  onValueChange: (tab: ProductListTab) => void;
  counts: ProductTabCounts;
};

export function ProductListTabs({
  value,
  onValueChange,
  counts,
}: ProductListTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: ProductListTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      {PRODUCT_TAB_ORDER.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack direction="row" spacing={1} sx={{
              alignItems: "center"
            }}>
              <Box component="span">{PRODUCT_TAB_LABELS[tab]}</Box>
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

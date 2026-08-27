"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Tab, Tabs } from "@/ui";
import {
  CUSTOMER_TAB_LABELS,
  CUSTOMER_TAB_ORDER,
} from "@/features/customers/lib/customer-tabs";
import type {
  CustomerListTab,
  CustomerTabCounts,
} from "@/features/customers/types/customer";

type CustomerListTabsProps = {
  value: CustomerListTab;
  onValueChange: (tab: CustomerListTab) => void;
  counts: CustomerTabCounts;
};

export function CustomerListTabs({
  value,
  onValueChange,
  counts,
}: CustomerListTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: CustomerListTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      {CUSTOMER_TAB_ORDER.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box component="span">{CUSTOMER_TAB_LABELS[tab]}</Box>
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

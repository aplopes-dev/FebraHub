"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Tab, Tabs } from "@/ui";
import {
  CARRIER_TAB_LABELS,
  CARRIER_TAB_ORDER,
  type CarrierListTab,
  type CarrierTabCounts,
} from "@/features/carriers/types/carrier";

type CarrierListTabsProps = {
  value: CarrierListTab;
  onValueChange: (tab: CarrierListTab) => void;
  counts: CarrierTabCounts;
};

export function CarrierListTabs({
  value,
  onValueChange,
  counts,
}: CarrierListTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: CarrierListTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      {CARRIER_TAB_ORDER.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box component="span">{CARRIER_TAB_LABELS[tab]}</Box>
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

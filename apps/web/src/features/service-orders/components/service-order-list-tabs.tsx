"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Tab, Tabs } from "@/ui";
import {
  SERVICE_ORDER_STATUS_BASE_TYPE_LABELS,
  SERVICE_ORDER_STATUS_BASE_TYPE_ORDER,
} from "@/features/service-orders/types/service-order-status";
import type {
  ServiceOrderListTab,
  ServiceOrderTabCounts,
} from "@/features/service-orders/types/service-order";

type ServiceOrderListTabsProps = {
  value: ServiceOrderListTab;
  onValueChange: (tab: ServiceOrderListTab) => void;
  counts: ServiceOrderTabCounts;
};

/** Tabs por tipo-base do status — status personalizados nunca quebram aqui. */
export function ServiceOrderListTabs({
  value,
  onValueChange,
  counts,
}: ServiceOrderListTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: ServiceOrderListTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      {SERVICE_ORDER_STATUS_BASE_TYPE_ORDER.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box component="span">
                {SERVICE_ORDER_STATUS_BASE_TYPE_LABELS[tab]}
              </Box>
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

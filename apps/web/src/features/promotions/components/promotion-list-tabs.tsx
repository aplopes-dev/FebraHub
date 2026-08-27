"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Tab, Tabs } from "@/ui";
import {
  PROMOTION_TAB_LABELS,
  PROMOTION_TAB_ORDER,
  type PromotionListTab,
  type PromotionTabCounts,
} from "@/features/promotions/types/promotion";

type PromotionListTabsProps = {
  value: PromotionListTab;
  onValueChange: (tab: PromotionListTab) => void;
  counts: PromotionTabCounts;
};

export function PromotionListTabs({
  value,
  onValueChange,
  counts,
}: PromotionListTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: PromotionListTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      {PROMOTION_TAB_ORDER.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box component="span">{PROMOTION_TAB_LABELS[tab]}</Box>
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

"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Tab, Tabs } from "@citybox/mui";
import {
  CARD_CONTRACT_TAB_LABELS,
  CARD_CONTRACT_TAB_ORDER,
  type CardContractListTab,
  type CardContractTabCounts,
} from "@/features/card-contracts/types/card-contract";

type CardContractListTabsProps = {
  value: CardContractListTab;
  onValueChange: (tab: CardContractListTab) => void;
  counts: CardContractTabCounts;
};

export function CardContractListTabs({
  value,
  onValueChange,
  counts,
}: CardContractListTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: CardContractListTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      {CARD_CONTRACT_TAB_ORDER.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box component="span">{CARD_CONTRACT_TAB_LABELS[tab]}</Box>
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

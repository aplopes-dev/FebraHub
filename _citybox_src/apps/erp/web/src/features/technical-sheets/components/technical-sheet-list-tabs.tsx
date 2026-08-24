"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Tab, Tabs } from "@citybox/mui";
import { TECHNICAL_SHEET_TAB_LABELS, TECHNICAL_SHEET_TAB_ORDER } from "@/features/technical-sheets/lib/technical-sheet-tabs";
import type { TechnicalSheetListTab, TechnicalSheetTabCounts } from "@/features/technical-sheets/types/technical-sheet";

type TechnicalSheetListTabsProps = {
  value: TechnicalSheetListTab;
  onValueChange: (tab: TechnicalSheetListTab) => void;
  counts: TechnicalSheetTabCounts;
};

export function TechnicalSheetListTabs({ value, onValueChange, counts }: TechnicalSheetListTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: TechnicalSheetListTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      {TECHNICAL_SHEET_TAB_ORDER.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack direction="row" spacing={1} sx={{
              alignItems: "center"
            }}>
              <Box component="span">{TECHNICAL_SHEET_TAB_LABELS[tab]}</Box>
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

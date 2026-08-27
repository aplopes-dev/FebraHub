"use client";

import { Box, Badge, Stack, Tab, Tabs } from "@/ui";
import {
  FISCAL_PARAMETER_TAB_LABELS,
  FISCAL_PARAMETER_TAB_ORDER,
} from "@/features/fiscal-parameters/lib/fiscal-parameters-tabs";
import type {
  FiscalParameterListTab,
  FiscalParameterTabCounts,
} from "@/features/fiscal-parameters/types/fiscal-parameters";

type FiscalParametersListTabsProps = {
  value: FiscalParameterListTab;
  onValueChange: (tab: FiscalParameterListTab) => void;
  counts: FiscalParameterTabCounts;
};

export function FiscalParametersListTabs({
  value,
  onValueChange,
  counts,
}: FiscalParametersListTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: FiscalParameterListTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 44,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      {FISCAL_PARAMETER_TAB_ORDER.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box component="span">{FISCAL_PARAMETER_TAB_LABELS[tab]}</Box>
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

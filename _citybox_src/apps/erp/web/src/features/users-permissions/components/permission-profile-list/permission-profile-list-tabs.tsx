"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Badge, Tab, Tabs } from "@citybox/mui";
import type {
  PermissionProfileListTab,
  PermissionProfileTabCounts,
} from "@/features/users-permissions/types/permission-profile";

const TAB_ORDER: PermissionProfileListTab[] = ["active", "deleted"];
const TAB_LABELS: Record<PermissionProfileListTab, string> = {
  active: "Ativos",
  deleted: "Excluídos",
};

type PermissionProfileListTabsProps = {
  value: PermissionProfileListTab;
  onValueChange: (tab: PermissionProfileListTab) => void;
  counts: PermissionProfileTabCounts;
};

export function PermissionProfileListTabs({
  value,
  onValueChange,
  counts,
}: PermissionProfileListTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, next: PermissionProfileListTab) => onValueChange(next)}
      sx={{ minHeight: 44, borderBottom: 1, borderColor: "divider", "& .MuiTabs-indicator": { height: 2 } }}
    >
      {TAB_ORDER.map((tab) => (
        <Tab
          key={tab}
          value={tab}
          label={
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box component="span">{TAB_LABELS[tab]}</Box>
              <Badge
                label={counts[tab]}
                color="muted"
                sx={{ height: 20, "& .MuiChip-label": { px: 0.75, fontSize: "0.75rem" } }}
              />
            </Stack>
          }
          sx={{ minHeight: 44, textTransform: "none", fontWeight: 500 }}
        />
      ))}
    </Tabs>
  );
}

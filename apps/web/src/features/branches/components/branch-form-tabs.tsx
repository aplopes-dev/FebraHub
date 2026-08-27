"use client";

import { Tab, Tabs } from "@/ui";

export type BranchFormTab = "registration";

type BranchFormTabsProps = {
  value: BranchFormTab;
  onValueChange: (value: BranchFormTab) => void;
};

export function BranchFormTabs({
  value,
  onValueChange,
}: BranchFormTabsProps) {
  const tabSx = {
    minHeight: 48,
    px: 2,
    textTransform: "none" as const,
    fontWeight: 500,
    color: "text.secondary",
    "&.Mui-selected": { color: "primary.main" },
  };

  return (
    <Tabs
      value={value}
      onChange={(_, next: BranchFormTab) => onValueChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        minHeight: 48,
        borderBottom: 1,
        borderColor: "divider",
        "& .MuiTabs-indicator": { height: 2 },
      }}
    >
      <Tab value="registration" label="Cadastro" sx={tabSx} />
    </Tabs>
  );
}

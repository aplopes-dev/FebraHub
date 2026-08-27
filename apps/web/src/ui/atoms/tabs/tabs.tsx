"use client";

import MuiTabs from "@mui/material/Tabs";
import type { TabsProps as MuiTabsProps } from "@mui/material/Tabs";

export type TabsProps = MuiTabsProps;

export function Tabs(props: TabsProps) {
  return <MuiTabs {...props} />;
}

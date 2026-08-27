"use client";

import MuiTab from "@mui/material/Tab";
import type { TabProps as MuiTabProps } from "@mui/material/Tab";

export type TabProps = MuiTabProps;

export function Tab(props: TabProps) {
  return <MuiTab {...props} />;
}

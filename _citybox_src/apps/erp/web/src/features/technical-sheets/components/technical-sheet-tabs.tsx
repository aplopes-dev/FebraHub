"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import { Tab, Tabs } from "@citybox/mui";
import type { TechnicalSheetFormTab } from "@/features/technical-sheets/types/technical-sheet";

const FORM_TABS: Array<{ value: TechnicalSheetFormTab; label: string }> = [
  { value: "product", label: "Composição do produto" },
  { value: "variations", label: "Composição das variações" },
];

type TechnicalSheetTabsProps = {
  value: TechnicalSheetFormTab;
  onValueChange: (value: TechnicalSheetFormTab) => void;
  showVariations: boolean;
  productContent: ReactNode;
  variationsContent: ReactNode;
};

export function TechnicalSheetTabs({ value, onValueChange, showVariations, productContent, variationsContent }: TechnicalSheetTabsProps) {
  const tabs = showVariations ? FORM_TABS : FORM_TABS.filter((tab) => tab.value !== "variations");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 2.5 }}>
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={value}
          onChange={(_, next) => onValueChange(next as TechnicalSheetFormTab)}
          sx={{
            minHeight: 48,
            "& .MuiTabs-indicator": { height: 2 },
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              sx={{
                minHeight: 48,
                textTransform: "none",
                fontWeight: 500,
                flex: "none",
              }}
            />
          ))}
        </Tabs>
      </Paper>

      <Box>
        {value === "product" ? productContent : null}
        {showVariations && value === "variations" ? variationsContent : null}
      </Box>
    </Box>
  );
}

"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { Tab, Tabs } from "@/ui";
import type { ProductFormTab } from "@/features/products/types/product-create";

const FORM_TABS: Array<{ value: ProductFormTab; label: string }> = [
  { value: "basics", label: "Dados Básicos" },
  { value: "variants", label: "Variações" },
  { value: "addons", label: "Adicionais" },
  { value: "suggestions", label: "Sugestões" },
];

type ProductFormTabsProps = {
  value: ProductFormTab;
  onValueChange: (value: ProductFormTab) => void;
  basicsContent: ReactNode;
  variantsContent: ReactNode;
  addonsContent: ReactNode;
  suggestionsContent: ReactNode;
};

export function ProductFormTabs({
  value,
  onValueChange,
  basicsContent,
  variantsContent,
  addonsContent,
  suggestionsContent,
}: ProductFormTabsProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minHeight: 0 }}>
      <Box
        sx={{
          width: "100%",
          overflow: "hidden",
          borderRadius: 1,
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Tabs
          value={value}
          onChange={(_, next: ProductFormTab) => onValueChange(next)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 48,
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTabs-indicator": { height: 2 },
          }}
        >
          {FORM_TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              sx={{
                minHeight: 48,
                px: 2,
                py: 2,
                textTransform: "none",
                fontWeight: 500,
                color: "text.secondary",
                "&.Mui-selected": { color: "primary.main" },
              }}
            />
          ))}
        </Tabs>
      </Box>

      {value === "basics" ? basicsContent : null}
      {value === "variants" ? variantsContent : null}
      {value === "addons" ? addonsContent : null}
      {value === "suggestions" ? suggestionsContent : null}
    </Box>
  );
}

"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { PRODUCTION_TYPE_OPTIONS } from "@/features/technical-sheets/lib/technical-sheet-filters";
import type { ProductionType } from "@/features/technical-sheets/types/technical-sheet";

type ProductionTypeSelectorProps = {
  value: ProductionType;
  onChange: (value: ProductionType) => void;
};

export function ProductionTypeSelector({ value, onChange }: ProductionTypeSelectorProps) {
  return (
    <Box
      role="radiogroup"
      aria-label="Tipo de produção"
      sx={{
        display: "inline-flex",
        p: 0.5,
        borderRadius: 1, // Matches the theme's standard borderRadius (1 = 8px)
        bgcolor: "action.hover",
        border: 1,
        borderColor: "divider",
        width: { xs: "100%", sm: "max-content" },
        minWidth: { sm: 440 },
      }}
    >
      {PRODUCTION_TYPE_OPTIONS.map((option) => {
        const isActive = option.value === value;

        return (
          <ButtonBase
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            sx={{
              flex: 1,
              py: 1,
              px: 3,
              borderRadius: 0.75, // Inside rounded track, slightly smaller radius
              fontSize: "0.875rem",
              fontWeight: 600,
              textTransform: "none",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease-in-out",
              color: isActive ? "primary.main" : "text.secondary",
              bgcolor: isActive ? "background.paper" : "transparent",
              boxShadow: isActive ? "0px 1px 3px rgba(0, 0, 0, 0.08)" : "none",
              "&:hover": {
                color: isActive ? "primary.main" : "text.primary",
                bgcolor: isActive ? "background.paper" : "rgba(0, 0, 0, 0.02)",
              },
            }}
          >
            {option.label}
          </ButtonBase>
        );
      })}
    </Box>
  );
}



"use client";

import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import Paper from "@mui/material/Paper";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import type { VehicleModelView } from "@/features/vehicle-models/lib/vehicle-model-view-storage";

type VehicleModelViewToggleProps = {
  value: VehicleModelView;
  onChange: (view: VehicleModelView) => void;
};

export function VehicleModelViewToggle({
  value,
  onChange,
}: VehicleModelViewToggleProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 0.5,
        borderRadius: 1.5,
        boxShadow: "none",
      }}
    >
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value}
        onChange={(_, next: VehicleModelView | null) => {
          if (next != null) onChange(next);
        }}
        aria-label="Visualização"
        sx={{
          gap: 0.5,
          "& .MuiToggleButtonGroup-grouped": {
            border: 0,
            borderRadius: "8px !important",
            px: 1.75,
            py: 0.75,
            gap: 0.75,
            textTransform: "none",
            fontWeight: 500,
            color: "text.secondary",
            "&:not(:first-of-type)": {
              marginLeft: 0,
            },
          },
          "& .MuiToggleButton-root.Mui-selected": {
            bgcolor: "primary.main",
            color: "primary.contrastText",
            "&:hover": {
              bgcolor: "primary.dark",
              color: "primary.contrastText",
            },
            "& .MuiSvgIcon-root": {
              color: "inherit",
            },
          },
        }}
      >
        <ToggleButton value="grid" aria-label="Grade">
          <GridViewIcon sx={{ fontSize: 18 }} />
          Grade
        </ToggleButton>
        <ToggleButton value="list" aria-label="Lista">
          <ViewListIcon sx={{ fontSize: 18 }} />
          Lista
        </ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  );
}

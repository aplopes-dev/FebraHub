"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { DatePicker, FormField } from "@/ui";
import {
  parseIsoDate,
  toIsoDate,
} from "@/features/promotions/lib/promotion-form-values";

type PromotionDateTimeFieldProps = {
  label: string;
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
};

/** Data + hora combinadas (DatePicker + input `time`). */
export function PromotionDateTimeField({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
}: PromotionDateTimeFieldProps) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <DatePicker
          label={label}
          value={parseIsoDate(date)}
          onChange={(selected) => {
            if (selected) onDateChange(toIsoDate(selected));
          }}
        />
      </Box>
      <FormField
        type="time"
        label="Hora"
        value={time}
        onChange={(event) => onTimeChange(event.target.value)}
        slotProps={{
          htmlInput: { "aria-label": `Horário — ${label}` },
        }}
        sx={{ width: 112, flexShrink: 0 }}
      />
    </Stack>
  );
}

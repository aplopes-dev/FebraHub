"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { DatePicker, FormField } from "@/ui";

function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 12);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type ServiceOrderDateTimeFieldProps = {
  label: string;
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
};

/** Data + hora combinadas (DatePicker + input `time`). */
export function ServiceOrderDateTimeField({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
}: ServiceOrderDateTimeFieldProps) {
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

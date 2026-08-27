"use client";

import type { ReactNode } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import Stack from "@mui/material/Stack";
import FormHelperText from "@mui/material/FormHelperText";

export type DateRange = {
  from?: Date;
  to?: Date;
};

export type DateRangePickerProps = {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  labelFrom?: string;
  labelTo?: string;
  helperText?: ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  /** `medium` (default) = 44px; `small` = 36px. */
  size?: "small" | "medium";
};

function toDayjs(date: Date | undefined): Dayjs | null {
  return date ? dayjs(date) : null;
}

/**
 * Intervalo de datas (início/fim) com LocalizationProvider embutido (dayjs pt-BR).
 * API alinhada ao DateRangePickerInput do `@/ui` (`from` / `to`).
 */
export function DateRangePicker({
  value,
  onChange,
  labelFrom = "Data início",
  labelTo = "Data fim",
  helperText,
  disabled,
  fullWidth = true,
  size = "medium",
}: DateRangePickerProps) {
  function emit(from: Date | undefined, to: Date | undefined) {
    if (!from && !to) {
      onChange?.(undefined);
      return;
    }
    onChange?.({ from, to });
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Stack spacing={1.5} sx={{ width: fullWidth ? "100%" : undefined }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ width: "100%" }}
        >
          <DatePicker
            label={labelFrom}
            value={toDayjs(value?.from)}
            disabled={disabled}
            onChange={(next) => {
              const from = next?.isValid() ? next.toDate() : undefined;
              emit(from, value?.to);
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                size,
              },
            }}
          />
          <DatePicker
            label={labelTo}
            value={toDayjs(value?.to)}
            disabled={disabled}
            minDate={value?.from ? dayjs(value.from) : undefined}
            onChange={(next) => {
              const to = next?.isValid() ? next.toDate() : undefined;
              emit(value?.from, to);
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                size,
              },
            }}
          />
        </Stack>
        {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
      </Stack>
    </LocalizationProvider>
  );
}

/** Alias para paridade com `@/ui` DateRangePickerInput. */
export const DateRangePickerInput = DateRangePicker;

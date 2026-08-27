"use client";

import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker as MuiDatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/pt-br";
import FormHelperText from "@mui/material/FormHelperText";
import Stack from "@mui/material/Stack";

/** Breakpoint em que o calendário vira popper (desktop). Abaixo: dialog mobile. */
const DESKTOP_PICKER_MQ = "(min-width:600px)";

/** Alinha seções do campo e ícone do picker no eixo vertical. */
const FIELD_ALIGN_SX: SxProps<Theme> = {
  width: "100%",
  minWidth: 0,
  maxWidth: "100%",
  "& .MuiPickersOutlinedInput-root, & .MuiPickersFilledInput-root": {
    alignItems: "center",
    minWidth: 0,
    width: "100%",
  },
  "& .MuiPickersSectionList-root, & .MuiPickersInputBase-sectionsContainer, & .MuiPickersOutlinedInput-sectionsContainer":
    {
      alignItems: "center",
      display: "flex",
      minWidth: 0,
      flex: 1,
      paddingTop: "0 !important",
      paddingBottom: "0 !important",
    },
  "& .MuiInputAdornment-root": {
    height: "auto",
    maxHeight: "none",
    alignItems: "center",
    margin: 0,
    flexShrink: 0,
  },
  "& .MuiIconButton-root": {
    marginRight: 0,
  },
};

const POPPER_SX: SxProps<Theme> = {
  zIndex: (theme) => theme.zIndex.modal + 1,
  "& .MuiPaper-root": {
    maxWidth: "min(100vw - 16px, 360px)",
  },
  "& .MuiDateCalendar-root": {
    width: "100%",
    maxWidth: "100%",
  },
  "& .MuiDayCalendar-weekContainer, & .MuiDayCalendar-header": {
    justifyContent: "space-between",
  },
};

const DIALOG_SX: SxProps<Theme> = {
  "& .MuiDialog-paper": {
    margin: 1.5,
    width: "calc(100% - 24px)",
    maxWidth: 360,
  },
  "& .MuiDateCalendar-root": {
    width: "100%",
    maxWidth: "100%",
  },
};

export type DatePickerProps = {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  label?: string;
  helperText?: ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  /** `medium` (default) = 44px; `small` = 36px — paridade com TextField/Select. */
  size?: "small" | "medium";
  minDate?: Date;
  maxDate?: Date;
  id?: string;
  placeholder?: string;
  sx?: SxProps<Theme>;
};

function toDayjs(date: Date | undefined): Dayjs | null {
  return date ? dayjs(date) : null;
}

function mergeSx(
  base: SxProps<Theme>,
  extra?: SxProps<Theme>,
): SxProps<Theme> {
  if (!extra) return base;
  return [base, extra] as SxProps<Theme>;
}

/**
 * Data única com LocalizationProvider embutido (dayjs pt-BR).
 * Paridade com DatePicker do `@/ui`.
 * Mobile (&lt;600px): calendário em dialog (sem scroll horizontal na página).
 */
export function DatePicker({
  value,
  onChange,
  label = "Data",
  helperText,
  disabled,
  fullWidth = true,
  size = "medium",
  minDate,
  maxDate,
  id,
  placeholder,
  sx,
}: DatePickerProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Stack
        spacing={0.5}
        sx={{
          width: fullWidth ? "100%" : undefined,
          minWidth: 0,
          maxWidth: "100%",
        }}
      >
        <MuiDatePicker
          label={label === "" ? undefined : label}
          value={toDayjs(value)}
          disabled={disabled}
          minDate={minDate ? dayjs(minDate) : undefined}
          maxDate={maxDate ? dayjs(maxDate) : undefined}
          desktopModeMediaQuery={DESKTOP_PICKER_MQ}
          onChange={(next) => {
            onChange?.(next?.isValid() ? next.toDate() : undefined);
          }}
          slotProps={{
            textField: {
              id,
              fullWidth,
              size,
              sx: mergeSx(FIELD_ALIGN_SX, sx),
              ...(placeholder
                ? { inputProps: { placeholder } }
                : {}),
            },
            popper: {
              sx: POPPER_SX,
              placement: "bottom-start",
              modifiers: [
                {
                  name: "preventOverflow",
                  options: {
                    altAxis: true,
                    padding: 8,
                    boundary: "viewport",
                  },
                },
                {
                  name: "flip",
                  options: { padding: 8 },
                },
              ],
            },
            dialog: {
              sx: DIALOG_SX,
            },
            mobilePaper: {
              sx: {
                maxWidth: "100%",
              },
            },
          }}
        />
        {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
      </Stack>
    </LocalizationProvider>
  );
}

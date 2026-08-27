"use client";

import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker as MuiTimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/pt-br";
import FormHelperText from "@mui/material/FormHelperText";
import Stack from "@mui/material/Stack";

dayjs.extend(customParseFormat);

const TIME_FORMAT = "HH:mm";

/** Alinha seções do campo e ícone do picker no eixo vertical. */
const FIELD_ALIGN_SX: SxProps<Theme> = {
  "& .MuiPickersOutlinedInput-root, & .MuiPickersFilledInput-root": {
    alignItems: "center",
  },
  "& .MuiPickersSectionList-root, & .MuiPickersInputBase-sectionsContainer, & .MuiPickersOutlinedInput-sectionsContainer":
    {
      alignItems: "center",
      display: "flex",
      paddingTop: "0 !important",
      paddingBottom: "0 !important",
    },
  "& .MuiInputAdornment-root": {
    height: "auto",
    maxHeight: "none",
    alignItems: "center",
    margin: 0,
  },
  "& .MuiIconButton-root": {
    marginRight: 0,
  },
};

/**
 * Dropdown do digital clock:
 * - paper NÃO herda a largura do TextField (causa o “vão” à esquerda das horas)
 * - colunas hora/minuto com largura fixa e itens centrados
 * - scrollbar oculta (mui/mui-x#9311)
 */
const DIGITAL_CLOCK_POPPER_SX: SxProps<Theme> = {
  minWidth: "unset !important",
  width: "auto !important",
  "& .MuiPickersLayout-root": {
    minWidth: "unset",
    width: "fit-content",
  },
  "& .MuiPickersLayout-contentWrapper": {
    display: "flex",
    justifyContent: "center",
    width: "fit-content",
    marginInline: "auto",
  },
  "& .MuiMultiSectionDigitalClock-root": {
    width: "fit-content",
    maxWidth: "100%",
    marginInline: "auto",
    justifyContent: "center",
    borderBottom: "none",
  },
  "& .MuiMultiSectionDigitalClockSection-root": {
    flex: "0 0 52px",
    width: 52,
    minWidth: 52,
    maxWidth: 52,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 0,
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    "&::-webkit-scrollbar": {
      display: "none",
      width: 0,
      height: 0,
    },
  },
  "& .MuiMultiSectionDigitalClockSection-item": {
    width: 40,
    minHeight: 40,
    margin: "2px 0",
    padding: 0,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    borderRadius: "50%",
  },
};

export type TimePickerProps = {
  /** Horário no formato `HH:mm` (24h). */
  value?: string;
  onChange?: (time: string | undefined) => void;
  label?: string;
  helperText?: ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  /** `medium` (default) = 44px; `small` = 36px — paridade com TextField/Select. */
  size?: "small" | "medium";
  /** Padrão `false` (24h), alinhado ao locale pt-BR. */
  ampm?: boolean;
  minutesStep?: number;
  id?: string;
  placeholder?: string;
  sx?: SxProps<Theme>;
  /** Oculta o botão/ícone de abrir o clock (útil quando o campo já tem ícone externo). */
  hideOpenPickerButton?: boolean;
};

function toDayjs(time: string | undefined): Dayjs | null {
  if (!time) return null;
  const parsed = dayjs(time, TIME_FORMAT, true);
  return parsed.isValid() ? parsed : null;
}

function mergeSx(
  base: SxProps<Theme>,
  extra?: SxProps<Theme>,
): SxProps<Theme> {
  if (!extra) return base;
  return [base, extra] as SxProps<Theme>;
}

/**
 * Horário único com LocalizationProvider embutido (dayjs pt-BR).
 * Valor controlado em `HH:mm` (24h) para APIs e formulários.
 */
export function TimePicker({
  value,
  onChange,
  label = "Horário",
  helperText,
  disabled,
  fullWidth = true,
  size = "medium",
  ampm = false,
  minutesStep = 5,
  id,
  placeholder,
  sx,
  hideOpenPickerButton = false,
}: TimePickerProps) {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Stack
        spacing={0.5}
        sx={{ width: fullWidth ? "100%" : "auto", minWidth: 0 }}
      >
        <MuiTimePicker
          label={label === "" ? undefined : label}
          value={toDayjs(value)}
          disabled={disabled}
          ampm={ampm}
          minutesStep={minutesStep}
          onChange={(next) => {
            onChange?.(next?.isValid() ? next.format(TIME_FORMAT) : undefined);
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
            openPickerButton: hideOpenPickerButton
              ? { sx: { display: "none" } }
              : undefined,
            inputAdornment: hideOpenPickerButton
              ? { sx: { display: "none" } }
              : undefined,
            popper: {
              sx: DIGITAL_CLOCK_POPPER_SX,
            },
            desktopPaper: {
              sx: DIGITAL_CLOCK_POPPER_SX,
            },
            layout: {
              sx: {
                minWidth: "unset",
                width: "fit-content",
              },
            },
            dialog: {
              sx: DIGITAL_CLOCK_POPPER_SX,
            },
          }}
        />
        {helperText ? <FormHelperText>{helperText}</FormHelperText> : null}
      </Stack>
    </LocalizationProvider>
  );
}

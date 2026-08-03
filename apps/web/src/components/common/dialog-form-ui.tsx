"use client";

import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import {
  Box,
  ButtonBase,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import type { ReactNode } from "react";

/** Remove o fundo cinza do tema nos campos dos modais. */
export const conversasFieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "transparent",
    backgroundColor: "transparent",
  },
  "& .MuiSelect-select": {
    bgcolor: "transparent",
  },
} as const;

export const conversasDialogPaperSx = {
  borderRadius: "14px",
  overflow: "hidden",
  boxShadow:
    "0 24px 48px color-mix(in srgb, var(--mui-palette-common-black) 12%, transparent)",
} as const;

type DialogHeaderProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  tone?: "primary" | "success" | "warning" | "info";
};

export function ConversasDialogHeader({
  icon,
  title,
  description,
  tone = "primary",
}: DialogHeaderProps) {
  return (
    <DialogTitle sx={{ pb: 1, pt: 2.5, px: 3 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: "12px",
            display: "grid",
            placeItems: "center",
            bgcolor: `color-mix(in srgb, var(--mui-palette-${tone}-main) 12%, transparent)`,
            color: `${tone}.main`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, pt: 0.25 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
            {title}
          </Typography>
          {description ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.35, lineHeight: 1.4 }}
            >
              {description}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </DialogTitle>
  );
}

export function ConversasDialogContent({ children }: { children: ReactNode }) {
  return (
    <DialogContent
      sx={{
        px: 3,
        pb: 1,
        // Sobrescreve o pt:0 do MUI quando há DialogTitle (label cortado)
        "&&": {
          pt: 3.5,
        },
      }}
    >
      <Stack spacing={2.5}>{children}</Stack>
    </DialogContent>
  );
}

export function ConversasDialogActions({ children }: { children: ReactNode }) {
  return (
    <DialogActions
      sx={{
        px: 3,
        py: 2,
        gap: 1,
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "transparent",
      }}
    >
      {children}
    </DialogActions>
  );
}

type FieldLabelProps = {
  children: ReactNode;
  optional?: boolean;
};

export function FieldLabel({ children, optional }: FieldLabelProps) {
  return (
    <Typography
      variant="caption"
      sx={{
        display: "block",
        mb: 1,
        fontWeight: 700,
        letterSpacing: 0.2,
        color: "text.secondary",
        textTransform: "uppercase",
        fontSize: "0.68rem",
      }}
    >
      {children}
      {optional ? (
        <Box
          component="span"
          sx={{ ml: 0.75, fontWeight: 500, textTransform: "none" }}
        >
          · opcional
        </Box>
      ) : null}
    </Typography>
  );
}

type OptionRadioCardProps = {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  indicator?: "radio" | "none";
  disabled?: boolean;
  badge?: ReactNode;
  sx?: SxProps<Theme>;
};

export function OptionRadioCard({
  selected,
  onClick,
  title,
  description,
  icon,
  indicator = "radio",
  disabled,
  badge,
  sx,
}: OptionRadioCardProps) {
  return (
    <ButtonBase
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      focusRipple={!disabled}
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 1.25,
        width: "100%",
        textAlign: "left",
        p: 1.5,
        borderRadius: "12px",
        border: "1.5px solid",
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected
          ? "color-mix(in srgb, var(--mui-palette-primary-main) 6%, transparent)"
          : "transparent",
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "border-color 0.15s, background-color 0.15s, box-shadow 0.15s",
        boxShadow: selected
          ? "0 0 0 3px color-mix(in srgb, var(--mui-palette-primary-main) 12%, transparent)"
          : "none",
        "&:hover": disabled
          ? undefined
          : {
              borderColor: selected ? "primary.main" : "text.secondary",
              bgcolor: selected
                ? "color-mix(in srgb, var(--mui-palette-primary-main) 8%, transparent)"
                : "action.hover",
            },
        ...sx,
      }}
    >
      {badge ? (
        <Box sx={{ position: "absolute", top: 8, right: 8 }}>{badge}</Box>
      ) : null}
      {icon ? (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            bgcolor: selected
              ? "primary.main"
              : "color-mix(in srgb, var(--mui-palette-text-primary) 6%, transparent)",
            color: selected ? "primary.contrastText" : "text.secondary",
          }}
        >
          {icon}
        </Box>
      ) : null}

      <Box sx={{ flex: 1, minWidth: 0, pt: icon ? 0.15 : 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
          {title}
        </Typography>
        {description ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.35, lineHeight: 1.35 }}
          >
            {description}
          </Typography>
        ) : null}
      </Box>

      {indicator === "radio" ? (
        <Box
          sx={{
            color: selected ? "primary.main" : "text.disabled",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            mt: 0.15,
          }}
        >
          {selected ? (
            <RadioButtonCheckedIcon sx={{ fontSize: 22 }} />
          ) : (
            <RadioButtonUncheckedIcon sx={{ fontSize: 22 }} />
          )}
        </Box>
      ) : null}
    </ButtonBase>
  );
}

type CheckboxCardProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description?: string;
};

export function CheckboxCard({
  checked,
  onChange,
  title,
  description,
}: CheckboxCardProps) {
  return (
    <ButtonBase
      onClick={() => onChange(!checked)}
      focusRipple
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.25,
        width: "100%",
        textAlign: "left",
        p: 1.5,
        borderRadius: "12px",
        border: "1.5px solid",
        borderColor: checked ? "primary.main" : "divider",
        bgcolor: checked
          ? "color-mix(in srgb, var(--mui-palette-primary-main) 6%, transparent)"
          : "transparent",
        transition: "border-color 0.15s, background-color 0.15s",
        "&:hover": {
          borderColor: checked ? "primary.main" : "text.secondary",
          bgcolor: checked
            ? "color-mix(in srgb, var(--mui-palette-primary-main) 8%, transparent)"
            : "action.hover",
        },
      }}
    >
      <Box
        sx={{
          color: checked ? "primary.main" : "text.disabled",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          mt: 0.1,
        }}
      >
        {checked ? (
          <CheckBoxIcon sx={{ fontSize: 22 }} />
        ) : (
          <CheckBoxOutlineBlankIcon sx={{ fontSize: 22 }} />
        )}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
          {title}
        </Typography>
        {description ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.35, lineHeight: 1.35 }}
          >
            {description}
          </Typography>
        ) : null}
      </Box>
    </ButtonBase>
  );
}

type CurrencyTextFieldProps = {
  /** Valor em reais (ex.: 756 = R$ 756,00). */
  value: number | null | undefined;
  onValueChange: (floatValue: number | undefined) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: ReactNode;
  name?: string;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/**
 * Campo monetário BRL no padrão brasileiro de digitação:
 * só números; os 2 últimos dígitos são centavos.
 * Ex.: 75600 → R$ 756,00
 */
export function CurrencyTextField({
  value,
  onValueChange,
  label,
  placeholder = "R$ 0,00",
  required,
  disabled,
  error,
  helperText,
  name,
  fullWidth = true,
  sx,
}: CurrencyTextFieldProps) {
  const displayValue =
    value == null || Number.isNaN(value) ? "" : formatBRL(value);

  return (
    <TextField
      fullWidth={fullWidth}
      label={label}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      error={error}
      helperText={helperText}
      name={name}
      value={displayValue}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "");
        if (!digits) {
          onValueChange(undefined);
          return;
        }
        onValueChange(Number(digits) / 100);
      }}
      onBlur={() => {
        if (value == null) return;
        onValueChange(Math.round(value * 100) / 100);
      }}
      inputMode="numeric"
      autoComplete="off"
      sx={{ ...conversasFieldSx, ...(sx as object) }}
    />
  );
}


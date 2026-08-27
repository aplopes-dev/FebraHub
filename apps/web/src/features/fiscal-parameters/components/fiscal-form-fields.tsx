"use client";

import InfoOutlined from "@mui/icons-material/InfoOutlined";

import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import {
  Autocomplete,
  Box,
  NumberInput,
  Stack,
  Tooltip,
  Typography,
} from "@/ui";
import {
  productFormSectionBoxSx,
  productFormSectionGridSx,
  productFormSectionHeaderSx,
} from "@/features/products/lib/product-form-section-styles";
import type { FiscalOption } from "@/features/fiscal-parameters/types/fiscal-parameters";

export const fiscalSectionGridSx = productFormSectionGridSx;
export const fiscalSectionBoxSx = productFormSectionBoxSx;
export const fiscalSectionHeaderSx = productFormSectionHeaderSx;

function FieldTooltip({ text, label }: { text: string; label: string }) {
  return (
    <Tooltip title={text}>
      <Box
        component="button"
        type="button"
        aria-label={label}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 16,
          height: 16,
          p: 0,
          border: 0,
          bgcolor: "transparent",
          color: "text.secondary",
          cursor: "help",
        }}
      >
        <InfoOutlined sx={{ fontSize: 14 }} />
      </Box>
    </Tooltip>
  );
}

type FiscalSelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FiscalOption[];
  placeholder?: string;
  tooltip?: string;
  disabled?: boolean;
  /** Quando o rótulo já aparece no card (ex.: grupo ICMS + switch). */
  hideFloatingLabel?: boolean;
};

export function FiscalSelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione",
  tooltip,
  disabled,
  hideFloatingLabel = false,
}: FiscalSelectFieldProps) {
  const selected =
    options.find((option) => option.value === value) ?? null;
  const floatingLabel = hideFloatingLabel ? undefined : label;

  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "flex-start" }}>
      <Autocomplete
        id={id}
        label={floatingLabel}
        placeholder={placeholder}
        options={options}
        value={selected}
        disabled={disabled}
        onChange={(_, option) => onChange(option?.value ?? "")}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(a, b) => a.value === b.value}
        noOptionsText="Nenhuma opção encontrada."
        sx={{ flex: 1, minWidth: 0 }}
      />
      {tooltip ? (
        <Box sx={{ flexShrink: 0, pt: 1.25 }}>
          <FieldTooltip text={tooltip} label={`Sobre ${label}`} />
        </Box>
      ) : null}
    </Stack>
  );
}

type FiscalInputFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  tooltip?: string;
};

export function FiscalInputField({
  id,
  label,
  value,
  onChange,
  suffix,
  tooltip,
}: FiscalInputFieldProps) {
  const numericValue = (() => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  })();

  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "flex-start" }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "flex-end", flex: 1, minWidth: 0 }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <NumberInput
            id={id}
            label={label}
            value={numericValue}
            minValue={0}
            step={0.01}
            onValueChange={(next) => onChange(String(next))}
          />
        </Box>
        {suffix ? (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", flexShrink: 0, pb: 1 }}
          >
            {suffix}
          </Typography>
        ) : null}
      </Stack>
      {tooltip ? (
        <Box sx={{ flexShrink: 0, pt: 1.25 }}>
          <FieldTooltip text={tooltip} label={`Sobre ${label}`} />
        </Box>
      ) : null}
    </Stack>
  );
}

export function FiscalSectionLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Box component="section" sx={fiscalSectionGridSx as SxProps<Theme>}>
      <Box sx={fiscalSectionHeaderSx as SxProps<Theme>} component="header">
        <Typography component="h2">{title}</Typography>
        <Typography component="p">{description}</Typography>
      </Box>
      <Box
        sx={
          {
            ...fiscalSectionBoxSx,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          } as SxProps<Theme>
        }
      >
        {children}
      </Box>
    </Box>
  );
}

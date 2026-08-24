"use client";

import { useState } from "react";
import {
  Box,
  CurrencyInput,
  DateRangePicker,
  FormControl,
  FormField,
  InputLabel,
  MenuItem,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Switch,
  Typography,
  type DateRange,
} from "@citybox/mui";
import { PRODUCT_CHANNEL_OPTIONS } from "@/features/products/data/mock-products";
import {
  PRICE_ADJUSTMENT_LABELS,
  PRICE_ADJUSTMENT_ORDER,
  type PriceAdjustmentType,
  type PriceListFormValues,
} from "@/features/price-lists/types/price-list";

const CHANNEL_OPTIONS = PRODUCT_CHANNEL_OPTIONS.map((channel) => ({
  value: channel.id,
  label: channel.name,
}));

type PriceListFormProps = {
  initialValues: PriceListFormValues;
  onSubmit: (values: PriceListFormValues) => void;
  formId: string;
};

function toDateRange(
  startDate: string | null,
  endDate: string | null,
): DateRange | undefined {
  if (!startDate && !endDate) return undefined;
  return {
    from: startDate ? new Date(startDate) : undefined,
    to: endDate ? new Date(endDate) : undefined,
  };
}

export function PriceListForm({
  initialValues,
  onSubmit,
  formId,
}: PriceListFormProps) {
  const [name, setName] = useState(initialValues.name);
  const [adjustmentType, setAdjustmentType] = useState<PriceAdjustmentType>(
    initialValues.adjustmentType,
  );
  const [adjustmentValue, setAdjustmentValue] = useState(
    initialValues.adjustmentValue,
  );
  const [channels, setChannels] = useState<string[]>(initialValues.channels);
  const [startDate, setStartDate] = useState<string | null>(
    initialValues.startDate,
  );
  const [endDate, setEndDate] = useState<string | null>(initialValues.endDate);
  const [active, setActive] = useState(initialValues.active);

  const isPercent =
    adjustmentType === "percent_markup" ||
    adjustmentType === "percent_discount";
  const isFixed = adjustmentType === "fixed_over_base";
  const showValueField = isPercent || isFixed;

  function handleValidityChange(range: DateRange | undefined) {
    setStartDate(range?.from ? range.from.toISOString() : null);
    setEndDate(range?.to ? range.to.toISOString() : null);
  }

  return (
    <Box
      component="form"
      id={formId}
      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          name,
          adjustmentType,
          adjustmentValue: showValueField ? adjustmentValue : 0,
          channels,
          startDate,
          endDate,
          active,
        });
      }}
    >
      <FormField
        id="price-list-name"
        label="Nome"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Ex.: Atacado, Promoção…"
        required
        autoFocus
      />

      <Box>
        <FormControl fullWidth>
          <InputLabel id="price-list-adjustment-label">
            Regra de ajuste
          </InputLabel>
          <Select
            labelId="price-list-adjustment-label"
            id="price-list-adjustment"
            label="Regra de ajuste"
            value={adjustmentType}
            onChange={(event) =>
              setAdjustmentType(event.target.value as PriceAdjustmentType)
            }
          >
            {PRICE_ADJUSTMENT_ORDER.map((type) => (
              <MenuItem key={type} value={type}>
                {PRICE_ADJUSTMENT_LABELS[type]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", mt: 0.5, display: "block" }}
        >
          Como o preço de cada produto é calculado a partir do preço base.
        </Typography>
      </Box>

      {showValueField ? (
        <Box>
          {isPercent ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <NumberInput
                id="price-list-value"
                label="Percentual do ajuste"
                value={adjustmentValue}
                minValue={0}
                step={0.01}
                onValueChange={(next) =>
                  setAdjustmentValue(Math.max(0, next))
                }
              />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                %
              </Typography>
            </Stack>
          ) : (
            <CurrencyInput
              id="price-list-value"
              label="Valor sobre a base"
              value={adjustmentValue}
              onValueChange={(value) => setAdjustmentValue(Math.max(0, value))}
            />
          )}
        </Box>
      ) : null}

      <MultiSelect
        label="Canais"
        options={CHANNEL_OPTIONS}
        value={channels}
        onChange={setChannels}
        placeholder="Todos os canais"
      />

      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
          Vigência
        </Typography>
        <DateRangePicker
          value={toDateRange(startDate, endDate)}
          onChange={handleValidityChange}
          helperText="Opcional. Sem prazo, a lista vale por tempo indeterminado."
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          p: 2,
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Ativa
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", lineHeight: 1.4 }}
          >
            Listas inativas deixam de ser aplicadas nas vendas.
          </Typography>
        </Stack>
        <Switch
          checked={active}
          onChange={(_, checked) => setActive(checked)}
          slotProps={{ input: { "aria-label": "Lista ativa" } }}
        />
      </Box>
    </Box>
  );
}

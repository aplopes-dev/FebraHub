"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import {
  Checkbox,
  FormField,
  Radio,
  RadioGroup,
} from "@citybox/mui";
import {
  PromotionField,
  PromotionSection,
} from "@/features/promotions/components/promotion-form/promotion-form-primitives";
import { PromotionDateTimeField } from "@/features/promotions/components/promotion-form/promotion-datetime-field";
import { PromotionUnitsSelector } from "@/features/promotions/components/promotion-form/promotion-units-selector";
import {
  WEEKDAY_LABELS,
  WEEKDAY_ORDER,
  type PromotionGeneralConfig,
  type PromotionRestrictionMode,
  type Weekday,
} from "@/features/promotions/types/promotion-form";

type PromotionGeneralStepProps = {
  values: PromotionGeneralConfig;
  onFieldChange: <K extends keyof PromotionGeneralConfig>(
    key: K,
    value: PromotionGeneralConfig[K],
  ) => void;
};

const CHECKBOX_OPTIONS: Array<{
  key: keyof Pick<
    PromotionGeneralConfig,
    "cumulative" | "optional" | "identifiedCustomersOnly"
  >;
  title: string;
  description: string;
}> = [
  {
    key: "cumulative",
    title: "Campanha acumulativa",
    description: "Permitir que outras promoções sejam ativadas na mesma venda.",
  },
  {
    key: "optional",
    title: "Campanha opcional",
    description: "O vendedor poderá escolher aplicar ou não essa promoção.",
  },
  {
    key: "identifiedCustomersOnly",
    title: "Ativar somente para clientes identificados",
    description:
      "A promoção será aplicada apenas se o cliente estiver identificado no momento da venda.",
  },
];

const RESTRICTION_OPTIONS: Array<{
  value: PromotionRestrictionMode;
  title: string;
  description: string;
}> = [
  {
    value: "none",
    title: "Sem restrições",
    description:
      "A promoção será aplicada em qualquer dia e para qualquer cliente, sem limitações adicionais.",
  },
  {
    value: "specific_weekdays",
    title: "Apenas em dias específicos da semana",
    description:
      "Você poderá escolher os dias em que a promoção será válida (ex.: apenas de segunda a sexta).",
  },
  {
    value: "customer_birthday_month",
    title: "Apenas no mês de aniversário do cliente",
    description:
      "A promoção será aplicada apenas se o cliente estiver identificado e estiver no mês do seu aniversário.",
  },
];

export function PromotionGeneralStep({
  values,
  onFieldChange,
}: PromotionGeneralStepProps) {
  function toggleWeekday(day: Weekday) {
    const next = values.weekdays.includes(day)
      ? values.weekdays.filter((item) => item !== day)
      : [...values.weekdays, day];
    onFieldChange("weekdays", next);
  }

  return (
    <Stack spacing={3}>
      <PromotionSection
        title="Dados da promoção"
        description="Nome, período de vigência e como a campanha se comporta na venda."
      >
        <Stack spacing={2}>
          <PromotionField label="Nome da promoção" htmlFor="promotion-name">
            <FormField
              id="promotion-name"
              label="Nome da promoção"
              value={values.name}
              onChange={(event) => onFieldChange("name", event.target.value)}
              placeholder="Ex.: Leve 3 pague 2 — Refrigerantes"
              sx={{
                "& .MuiInputLabel-root": { display: "none" },
                "& .MuiOutlinedInput-notchedOutline legend": { display: "none" },
              }}
            />
          </PromotionField>

          <PromotionField
            label="Descrição"
            htmlFor="promotion-description"
            optional
          >
            <FormField
              id="promotion-description"
              label="Descrição"
              multiline
              minRows={3}
              value={values.description}
              onChange={(event) =>
                onFieldChange("description", event.target.value)
              }
              placeholder="Detalhe a campanha para a equipe (não aparece para o cliente)."
              sx={{
                "& .MuiInputLabel-root": { display: "none" },
                "& .MuiOutlinedInput-notchedOutline legend": { display: "none" },
              }}
            />
          </PromotionField>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { sm: "1fr 1fr" },
            }}
          >
            <PromotionField label="Início da vigência">
              <PromotionDateTimeField
                label="Início"
                date={values.startDate}
                time={values.startTime}
                onDateChange={(date) => onFieldChange("startDate", date)}
                onTimeChange={(time) => onFieldChange("startTime", time)}
              />
            </PromotionField>

            <PromotionField label="Término da vigência">
              <PromotionDateTimeField
                label="Término"
                date={values.endDate}
                time={values.endTime}
                onDateChange={(date) => onFieldChange("endDate", date)}
                onTimeChange={(time) => onFieldChange("endTime", time)}
              />
            </PromotionField>
          </Box>

          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            {CHECKBOX_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.key}
                sx={{ alignItems: "flex-start", m: 0, gap: 1 }}
                control={
                  <Checkbox
                    id={`promotion-${option.key}`}
                    checked={values[option.key]}
                    onChange={(_, checked) =>
                      onFieldChange(option.key, checked)
                    }
                    sx={{ mt: -0.25 }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {option.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {option.description}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </Stack>
        </Stack>
      </PromotionSection>

      <PromotionSection
        title="Unidades"
        description="Escolha em quais unidades esta promoção ficará disponível."
      >
        <PromotionUnitsSelector
          selectedUnitIds={values.unitIds}
          onChange={(unitIds) => onFieldChange("unitIds", unitIds)}
        />
      </PromotionSection>

      <PromotionSection
        title="Configuração de restrição"
        description="Define se a promoção deve se aplicar apenas em determinados casos."
      >
        <RadioGroup
          value={values.restrictionMode}
          onChange={(_, next) =>
            onFieldChange("restrictionMode", next as PromotionRestrictionMode)
          }
        >
          <Stack spacing={1.5}>
            {RESTRICTION_OPTIONS.map((option) => {
              const isActive = values.restrictionMode === option.value;
              return (
                <Box key={option.value}>
                  <Box
                    component="label"
                    htmlFor={`restriction-${option.value}`}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      border: 1,
                      borderRadius: 1,
                      p: 1.5,
                      cursor: "pointer",
                      borderColor: isActive
                        ? (theme) => alpha(theme.palette.primary.main, 0.5)
                        : "divider",
                      bgcolor: isActive
                        ? (theme) => alpha(theme.palette.primary.main, 0.05)
                        : "transparent",
                    }}
                  >
                    <Radio
                      id={`restriction-${option.value}`}
                      value={option.value}
                      size="small"
                      sx={{ mt: -0.25 }}
                    />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {option.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary" }}
                      >
                        {option.description}
                      </Typography>
                    </Box>
                  </Box>

                  {option.value === "specific_weekdays" && isActive ? (
                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      sx={{ flexWrap: "wrap", mt: 1.5, pl: 1.5 }}
                    >
                      {WEEKDAY_ORDER.map((day) => {
                        const selected = values.weekdays.includes(day);
                        return (
                          <ButtonBase
                            key={day}
                            type="button"
                            onClick={() => toggleWeekday(day)}
                            aria-pressed={selected}
                            sx={{
                              borderRadius: 999,
                              border: 1,
                              px: 1.5,
                              py: 0.75,
                              typography: "body2",
                              borderColor: selected ? "primary.main" : "divider",
                              bgcolor: selected ? "primary.main" : "transparent",
                              color: selected
                                ? "primary.contrastText"
                                : "text.secondary",
                              "&:hover": {
                                borderColor: "primary.main",
                                color: selected
                                  ? "primary.contrastText"
                                  : "text.primary",
                              },
                            }}
                          >
                            {WEEKDAY_LABELS[day]}
                          </ButtonBase>
                        );
                      })}
                    </Stack>
                  ) : null}
                </Box>
              );
            })}
          </Stack>
        </RadioGroup>
      </PromotionSection>
    </Stack>
  );
}

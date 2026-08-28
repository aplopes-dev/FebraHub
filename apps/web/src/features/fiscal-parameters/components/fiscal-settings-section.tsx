"use client";

import { Box, Stack, Switch, Typography } from "@/ui";
import {
  FiscalSectionLayout,
  FiscalSelectField,
} from "@/features/fiscal-parameters/components/fiscal-form-fields";
import {
  CFOP_OPTIONS,
  ICMS_OPTIONS,
  IPI_OPTIONS,
  ISSQN_OPTIONS,
  PIS_COFINS_OPTIONS,
} from "@/features/fiscal-parameters/data/fiscal-options";
import type {
  FiscalGroupField,
  FiscalGroupValues,
  FiscalOption,
  FiscalUnitConfig,
} from "@/features/fiscal-parameters/types/fiscal-parameters";

export type FiscalBranchOption = {
  id: string;
  displayName: string;
};

/** Rótulo do padrão da organização por tributo, para exibir a herança. */
export type FiscalInheritedLabels = Partial<Record<GroupFieldKey, string>>;

type FiscalSettingsSectionProps = {
  group: FiscalGroupValues;
  units: FiscalUnitConfig[];
  branches: FiscalBranchOption[];
  onGroupChange: (next: FiscalGroupValues) => void;
  onUnitsChange: (next: FiscalUnitConfig[]) => void;
  /** Valor herdado do padrão da organização (spec erp/014) — só exibição. */
  inherited?: FiscalInheritedLabels;
};

type GroupFieldKey = keyof FiscalGroupValues;
type UnitFieldKey = "icms" | "pisCofins" | "ipi" | "cfop" | "issqn";

const CFOP_TOOLTIP =
  "O CFOP indica a natureza da operação (venda dentro ou fora do estado, com ou sem substituição tributária) na emissão da nota.";

const GROUP_FIELDS: {
  key: GroupFieldKey;
  unitKey: UnitFieldKey;
  label: string;
  options: FiscalOption[];
  tooltip?: string;
}[] = [
  { key: "icms", unitKey: "icms", label: "ICMS", options: ICMS_OPTIONS },
  {
    key: "pisCofins",
    unitKey: "pisCofins",
    label: "Pis & Cofins",
    options: PIS_COFINS_OPTIONS,
  },
  { key: "ipi", unitKey: "ipi", label: "IPI", options: IPI_OPTIONS },
  {
    key: "cfop",
    unitKey: "cfop",
    label: "CFOP Padrão",
    options: CFOP_OPTIONS,
    tooltip: CFOP_TOOLTIP,
  },
  {
    key: "issqn",
    unitKey: "issqn",
    label: "ISSQN",
    options: ISSQN_OPTIONS,
    tooltip:
      "Tributação do ISSQN na NFS-e (serviços). A alíquota é municipal e definida no grupo fiscal.",
  },
];

function GroupFieldControl({
  id,
  label,
  options,
  tooltip,
  field,
  onChange,
  inheritedLabel,
}: {
  id: string;
  label: string;
  options: FiscalOption[];
  tooltip?: string;
  field: FiscalGroupField;
  onChange: (next: FiscalGroupField) => void;
  inheritedLabel?: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        p: 1.5,
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        borderRadius: 2,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Todas as unidades
          </Typography>
          <Switch
            size="small"
            checked={field.applyToAll}
            onChange={(_, checked) =>
              onChange({ ...field, applyToAll: checked })
            }
            slotProps={{
              input: { "aria-label": `Aplicar ${label} a todas as unidades` },
            }}
          />
        </Stack>
      </Stack>
      <FiscalSelectField
        id={id}
        label={label}
        value={field.value}
        onChange={(value) => onChange({ ...field, value })}
        options={options}
        tooltip={tooltip}
        hideFloatingLabel
      />
      {!field.value && inheritedLabel ? (
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Herdado do padrão: {inheritedLabel}
        </Typography>
      ) : null}
    </Box>
  );
}

export function FiscalSettingsSection({
  group,
  units,
  branches,
  onGroupChange,
  onUnitsChange,
  inherited,
}: FiscalSettingsSectionProps) {
  const branchNameById = new Map(
    branches.map((branch) => [branch.id, branch.displayName] as const),
  );

  function updateGroupField(key: GroupFieldKey, next: FiscalGroupField) {
    onGroupChange({ ...group, [key]: next });
  }

  function updateUnitField(
    branchId: string,
    key: UnitFieldKey,
    value: string,
  ) {
    onUnitsChange(
      units.map((unit) =>
        unit.branchId === branchId ? { ...unit, [key]: value } : unit,
      ),
    );
  }

  return (
    <FiscalSectionLayout
      title="Configurações fiscais"
      description="Agrupe e personalize regras fiscais de acordo com a necessidade de cada unidade, facilitando a gestão tributária em diferentes localidades."
    >
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Definir grupos fiscais para todas as unidades
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          Ative os campos para aplicar a seleção em todas as unidades. Para
          ajustes individuais, desative a opção do grupo.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        {GROUP_FIELDS.map((entry) => (
          <GroupFieldControl
            key={entry.key}
            id={`fiscal-group-${entry.key}`}
            label={entry.label}
            options={entry.options}
            tooltip={entry.tooltip}
            field={group[entry.key]}
            onChange={(next) => updateGroupField(entry.key, next)}
            inheritedLabel={inherited?.[entry.key]}
          />
        ))}
      </Box>

      <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2.5 }}>
        <Stack spacing={2.5}>
          {units.map((unit) => (
            <Box key={unit.branchId}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                {branchNameById.get(unit.branchId) ?? unit.branchId}
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" },
                }}
              >
                {GROUP_FIELDS.map((entry) => {
                  const applied = group[entry.key].applyToAll;
                  const displayValue = applied
                    ? group[entry.key].value
                    : unit[entry.unitKey];
                  return (
                    <FiscalSelectField
                      key={entry.unitKey}
                      id={`fiscal-unit-${unit.branchId}-${entry.unitKey}`}
                      label={entry.label}
                      value={displayValue}
                      onChange={(value) =>
                        updateUnitField(unit.branchId, entry.unitKey, value)
                      }
                      options={entry.options}
                      tooltip={entry.tooltip}
                      disabled={applied}
                    />
                  );
                })}
              </Box>
            </Box>
          ))}
          {units.length === 0 ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Nenhuma unidade cadastrada.
            </Typography>
          ) : null}
        </Stack>
      </Box>
    </FiscalSectionLayout>
  );
}

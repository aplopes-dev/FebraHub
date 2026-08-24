"use client";

import { Box } from "@citybox/mui";
import {
  FiscalInputField,
  FiscalSectionLayout,
  FiscalSelectField,
} from "@/features/fiscal-parameters/components/fiscal-form-fields";
import {
  CEST_OPTIONS,
  CST_IBS_CBS_OPTIONS,
  NCM_OPTIONS,
  ORIGIN_OPTIONS,
  TAX_CLASSIFICATION_OPTIONS,
} from "@/features/fiscal-parameters/data/fiscal-options";
import type { FiscalInfoValues } from "@/features/fiscal-parameters/types/fiscal-parameters";

type FiscalInfoSectionProps = {
  value: FiscalInfoValues;
  onChange: (next: FiscalInfoValues) => void;
};

const NCM_TOOLTIP =
  "A NCM é o código que classifica a mercadoria. Ela define os impostos aplicados ao produto na emissão da nota fiscal.";

const CEST_TOOLTIP =
  "O CEST identifica produtos sujeitos à substituição tributária do ICMS. Use apenas quando a mercadoria exigir.";

export function FiscalInfoSection({ value, onChange }: FiscalInfoSectionProps) {
  function update<K extends keyof FiscalInfoValues>(
    key: K,
    next: FiscalInfoValues[K],
  ) {
    onChange({ ...value, [key]: next });
  }

  return (
    <FiscalSectionLayout
      title="Informações fiscais"
      description="Centralize os dados fiscais deste produto para facilitar sua gestão e evitar divergências nos processos contábeis."
    >
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <FiscalSelectField
          id="fiscal-ncm"
          label="NCM"
          value={value.ncm}
          onChange={(next) => update("ncm", next)}
          options={NCM_OPTIONS}
          tooltip={NCM_TOOLTIP}
        />
        <FiscalSelectField
          id="fiscal-origin"
          label="Origem"
          value={value.origin}
          onChange={(next) => update("origin", next)}
          options={ORIGIN_OPTIONS}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(3, minmax(0, 1fr))",
          },
        }}
      >
        <FiscalInputField
          id="fiscal-net-weight"
          label="Peso líquido"
          value={value.netWeight}
          onChange={(next) => update("netWeight", next)}
          suffix="kg"
        />
        <FiscalInputField
          id="fiscal-gross-weight"
          label="Peso bruto"
          value={value.grossWeight}
          onChange={(next) => update("grossWeight", next)}
          suffix="kg"
        />
        <FiscalSelectField
          id="fiscal-cest"
          label="CEST"
          value={value.cest}
          onChange={(next) => update("cest", next)}
          options={CEST_OPTIONS}
          tooltip={CEST_TOOLTIP}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(3, minmax(0, 1fr))",
          },
        }}
      >
        <FiscalInputField
          id="fiscal-fcp"
          label="FCP"
          value={value.fcp}
          onChange={(next) => update("fcp", next)}
          suffix="%"
        />
        <FiscalInputField
          id="fiscal-fcp-st"
          label="FCP por ST"
          value={value.fcpSt}
          onChange={(next) => update("fcpSt", next)}
          suffix="%"
        />
        <FiscalInputField
          id="fiscal-fcp-st-retained"
          label="FCP por ST retido"
          value={value.fcpStRetained}
          onChange={(next) => update("fcpStRetained", next)}
          suffix="%"
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <FiscalSelectField
          id="fiscal-cst-ibs-cbs"
          label="CST do IBS/CBS"
          value={value.cstIbsCbs}
          onChange={(next) => update("cstIbsCbs", next)}
          options={CST_IBS_CBS_OPTIONS}
        />
        <FiscalSelectField
          id="fiscal-tax-classification"
          label="Cód. Classificação Tributária"
          value={value.taxClassification}
          onChange={(next) => update("taxClassification", next)}
          options={TAX_CLASSIFICATION_OPTIONS}
        />
      </Box>
    </FiscalSectionLayout>
  );
}

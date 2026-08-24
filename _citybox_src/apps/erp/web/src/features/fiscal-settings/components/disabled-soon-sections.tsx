"use client";

import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { Input } from "@citybox/mui";
import {
  FormSection,
  formFieldGridSx,
  formFieldSpanSx,
} from "@/components/ui/form";

/**
 * Campos do print que ainda NÃO têm backend (spec erp/012, FR-006): renderizados
 * na estrutura da referência, porém **desabilitados** com legenda "em breve".
 * Nenhum aceita edição — sem descarte silencioso no envio. Backlog nomeado no
 * plan.md D1 (fiscal-api × erp-api).
 *
 * "Justificativas padrão" saiu daqui (spec erp/023, N6) — tem backend agora,
 * campos reais em `general-settings-form.tsx`. "Vendas e base de cálculo" e
 * "Outras configurações" continuam aqui por decisão explícita do usuário no
 * `/speckit-clarify` da 023 (não entraram no escopo desta rodada).
 */
const SOON = "Em breve";

function SoonField({ label }: { label: string }) {
  return <Input label={label} value="" fullWidth disabled helperText={SOON} />;
}

function SoonSwitch({ label }: { label: string }) {
  return (
    <FormControlLabel
      control={<Switch disabled />}
      label={`${label} (em breve)`}
    />
  );
}

export function DisabledSoonSections() {
  return (
    <>
      <FormSection
        title="Vendas e base de cálculo"
        description="Padrões de emissão — dependem de configuração no backend (em breve)."
      >
        <Box sx={formFieldGridSx}>
          <Box sx={formFieldSpanSx(12)}>
            <SoonSwitch label="Operação com consumidor final por padrão" />
          </Box>
          <Box sx={formFieldSpanSx(12)}>
            <SoonSwitch label="Cliente padrão é contribuinte de ICMS" />
          </Box>
          <Box sx={formFieldSpanSx(6)}>
            <SoonField label="Modalidade de frete (PDV)" />
          </Box>
          <Box sx={formFieldSpanSx(6)}>
            <SoonField label="Alíquota de crédito (%)" />
          </Box>
          <Box sx={formFieldSpanSx(12)}>
            <SoonSwitch label="Incluir frete na base de PIS/COFINS" />
          </Box>
          <Box sx={formFieldSpanSx(12)}>
            <SoonSwitch label="Incluir IPI na base de cálculo" />
          </Box>
        </Box>
      </FormSection>

      <FormSection
        title="Outras configurações"
        description="Substituto tributário, intermediadores, envio automático e dados de pagamento (em breve)."
      >
        <Box sx={formFieldGridSx}>
          <Box sx={formFieldSpanSx(12)}>
            <SoonSwitch label="Enviar XML/DANFE ao cliente automaticamente" />
          </Box>
          <Box sx={formFieldSpanSx(12)}>
            <SoonSwitch label="Permitir que o contador inutilize as notas" />
          </Box>
          <Box sx={formFieldSpanSx(6)}>
            <SoonField label="Inscrições Estaduais do Substituto Tributário" />
          </Box>
          <Box sx={formFieldSpanSx(6)}>
            <SoonField label="Intermediadores da transação" />
          </Box>
        </Box>
      </FormSection>
    </>
  );
}

"use client";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Checkbox,
  FormControlLabel,
  FormField,
  Radio,
  RadioGroup,
} from "@citybox/mui";
import { CarrierSection } from "@/features/carriers/components/carrier-section";
import {
  documentLabel,
  type CarrierDeliveryType,
  type CarrierFiscal,
  type CarrierFormValues,
  type PersonType,
} from "@/features/carriers/types/carrier";

const TRADE_NAME_MAX = 60;

type CarrierGeneralSectionProps = {
  values: CarrierFormValues;
  onChange: <K extends keyof CarrierFormValues>(
    key: K,
    value: CarrierFormValues[K],
  ) => void;
};

export function CarrierGeneralSection({
  values,
  onChange,
}: CarrierGeneralSectionProps) {
  function setFiscal(partial: Partial<CarrierFiscal>) {
    onChange("fiscal", { ...values.fiscal, ...partial });
  }

  return (
    <CarrierSection
      title="Informações gerais"
      description="Defina se o cadastro será para uma transportadora ou um entregador individual e informe os dados necessários para identificação e faturamento."
    >
      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Tipo de pessoa
          </Typography>
          <RadioGroup
            row
            value={values.personType}
            onChange={(event) =>
              onChange("personType", event.target.value as PersonType)
            }
            sx={{ minHeight: 36, alignItems: "center" }}
          >
            <FormControlLabel
              value="juridica"
              control={<Radio />}
              label="Pessoa jurídica"
            />
            <FormControlLabel
              value="fisica"
              control={<Radio />}
              label="Pessoa física"
            />
          </RadioGroup>
        </Box>

        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Tipo de entrega
          </Typography>
          <RadioGroup
            row
            value={values.deliveryType}
            onChange={(event) =>
              onChange("deliveryType", event.target.value as CarrierDeliveryType)
            }
            sx={{ minHeight: 36, alignItems: "center" }}
          >
            <FormControlLabel
              value="transportadora"
              control={<Radio />}
              label="Transportadora"
            />
            <FormControlLabel
              value="entregador"
              control={<Radio />}
              label="Entregador Delivery"
            />
          </RadioGroup>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: { sm: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        <Box sx={{ position: "relative" }}>
          <FormField
            id="carrier-trade-name"
            label="Nome fantasia"
            value={values.tradeName}
            onChange={(event) => onChange("tradeName", event.target.value)}
            slotProps={{ htmlInput: { maxLength: TRADE_NAME_MAX } }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              position: "absolute",
              top: "50%",
              right: 12,
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            {values.tradeName.length}
          </Typography>
        </Box>
        <FormField
          id="carrier-legal-name"
          label="Razão social"
          value={values.legalName}
          onChange={(event) => onChange("legalName", event.target.value)}
        />
        <FormField
          id="carrier-document"
          label={documentLabel(values.personType)}
          value={values.document}
          onChange={(event) => onChange("document", event.target.value)}
        />
      </Box>

      <Stack spacing={2.5} sx={{ pt: 0.5 }}>
        <Divider />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Informações fiscais
        </Typography>

        <Stack direction="row" spacing={3} useFlexGap sx={{ flexWrap: "wrap" }}>
          <FiscalCheckbox
            id="carrier-icms"
            label="Isento de ICMS"
            checked={values.fiscal.icmsExempt}
            onChange={(checked) => setFiscal({ icmsExempt: checked })}
          />
          <FiscalCheckbox
            id="carrier-nfe"
            label="Registrar na NFE"
            checked={values.fiscal.registerInNfe}
            onChange={(checked) => setFiscal({ registerInNfe: checked })}
          />
          <FiscalCheckbox
            id="carrier-no-ie"
            label="Sem Inscrição Estadual (IE)"
            checked={values.fiscal.noStateRegistration}
            onChange={(checked) =>
              setFiscal({ noStateRegistration: checked })
            }
          />
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          <FormField
            id="carrier-ie"
            label="Inscrição estadual"
            value={values.fiscal.stateRegistration}
            disabled={values.fiscal.noStateRegistration}
            onChange={(event) =>
              setFiscal({ stateRegistration: event.target.value })
            }
          />
          <FormField
            id="carrier-im"
            label="Inscrição municipal"
            value={values.fiscal.municipalRegistration}
            onChange={(event) =>
              setFiscal({ municipalRegistration: event.target.value })
            }
          />
        </Box>
      </Stack>
    </CarrierSection>
  );
}

function FiscalCheckbox({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <FormControlLabel
      control={
        <Checkbox
          id={id}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
      }
      label={<Typography variant="body2">{label}</Typography>}
    />
  );
}

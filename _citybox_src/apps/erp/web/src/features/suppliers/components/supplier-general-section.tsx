"use client";

import ChevronRight from "@mui/icons-material/ChevronRight";
import InfoOutlined from "@mui/icons-material/InfoOutlined";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Button,
  Checkbox,
  DatePicker,
  FormControlLabel,
  FormField,
  Radio,
  RadioGroup,
  Tooltip,
} from "@citybox/mui";
import { SupplierDocumentField } from "@/features/suppliers/components/supplier-document-field";
import { SupplierSection } from "@/features/suppliers/components/supplier-section";
import { ProductUnitsDrawer } from "@/features/products/components/product-units-drawer";
import { useBranchUnits } from "@/features/products/hooks/use-branch-units";
import { parseIsoDate, toIsoDate } from "@/lib/date";
import {
  type PersonType,
  type SupplierFormValues,
} from "@/features/suppliers/types/supplier";

const NAME_MAX = 40;
const NOTE_MAX = 600;
/** Altura reservada para o checkbox "Isento" — alinha CNPJ / IE / IM. */
const FIELD_TOP_SLOT_SX = { height: 32, display: "flex", alignItems: "center" };

type SupplierGeneralSectionProps = {
  values: SupplierFormValues;
  onChange: <K extends keyof SupplierFormValues>(
    key: K,
    value: SupplierFormValues[K],
  ) => void;
};

export function SupplierGeneralSection({
  values,
  onChange,
}: SupplierGeneralSectionProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const foundationDate = parseIsoDate(values.foundationDate);
  const units = useBranchUnits();

  return (
    <>
      <SupplierSection
        title="Dados do fornecedor"
        description="Insira as informações principais para identificar e gerenciar o fornecedor."
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
            Tipo de pessoa
          </Typography>
          <RadioGroup
            row
            value={values.personType}
            onChange={(event) => {
              const next = event.target.value as PersonType;
              onChange("personType", next);
              onChange("document", "");
            }}
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

        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          <Box sx={{ position: "relative" }}>
            <FormField
              id="sup-name"
              label="Nome do fornecedor"
              value={values.name}
              onChange={(event) => onChange("name", event.target.value)}
              slotProps={{ htmlInput: { maxLength: NAME_MAX } }}
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
              {values.name.length}
            </Typography>
          </Box>
          <FormField
            id="sup-legal-name"
            label="Razão social"
            value={values.legalName}
            onChange={(event) => onChange("legalName", event.target.value)}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: { sm: "repeat(3, minmax(0, 1fr))" },
            alignItems: "end",
          }}
        >
          <Box>
            <Box sx={FIELD_TOP_SLOT_SX} aria-hidden />
            <SupplierDocumentField
              personType={values.personType}
              value={values.document}
              onChange={(document) => onChange("document", document)}
            />
          </Box>

          <Box>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                ...FIELD_TOP_SLOT_SX,
                justifyContent: "flex-end",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={values.stateExempt}
                    onChange={(event) =>
                      onChange("stateExempt", event.target.checked)
                    }
                  />
                }
                label={
                  <Typography variant="caption" color="text.secondary">
                    Isento
                  </Typography>
                }
                sx={{ mr: 0 }}
              />
            </Stack>
            <FormField
              id="sup-ie"
              label="Inscrição Estadual"
              value={values.stateRegistration}
              disabled={values.stateExempt}
              onChange={(event) =>
                onChange("stateRegistration", event.target.value)
              }
            />
          </Box>

          <Box>
            <Box sx={FIELD_TOP_SLOT_SX} aria-hidden />
            <FormField
              id="sup-im"
              label="Inscrição municipal"
              value={values.municipalRegistration}
              onChange={(event) =>
                onChange("municipalRegistration", event.target.value)
              }
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" },
            alignItems: "start",
          }}
        >
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "flex-start" }}>
            <FormField
              id="sup-sufama"
              label="Inscrição SUFRAMA"
              value={values.sufamaRegistration}
              onChange={(event) =>
                onChange("sufamaRegistration", event.target.value)
              }
              sx={{ flex: 1, minWidth: 0 }}
            />
            <Tooltip title="Registro da Superintendência da Zona Franca de Manaus, usado para benefícios fiscais em operações com a região.">
              <Box
                component="button"
                type="button"
                aria-label="O que é Inscrição SUFRAMA"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  mt: 1.25,
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
          </Stack>
          <DatePicker
            id="sup-foundation"
            label="Data de fundação"
            value={foundationDate}
            onChange={(date) =>
              onChange("foundationDate", date ? toIsoDate(date) : "")
            }
          />
        </Box>

        <Box
          role="button"
          tabIndex={0}
          onClick={() => setDrawerOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setDrawerOpen(true);
            }
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            width: "100%",
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.default",
            px: 2,
            py: 1.5,
            cursor: "pointer",
            transition: "background-color 0.2s",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Escolha em quais unidades exibir
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {values.unitIds.length} de {units.length} unidades selecionadas
            </Typography>
          </Box>
          <Button
            type="button"
            variant="outlined"
            onClick={(event) => {
              event.stopPropagation();
              setDrawerOpen(true);
            }}
            endIcon={<ChevronRight sx={{ fontSize: 16 }} />}
          >
            Selecionar unidades
          </Button>
        </Box>

        <Box sx={{ position: "relative" }}>
          <FormField
            id="sup-note"
            label="Observação sobre este fornecedor (opcional)"
            value={values.note}
            multiline
            minRows={3}
            onChange={(event) => onChange("note", event.target.value)}
            slotProps={{ htmlInput: { maxLength: NOTE_MAX } }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              position: "absolute",
              right: 12,
              bottom: 10,
              pointerEvents: "none",
            }}
          >
            {values.note.length}
          </Typography>
        </Box>
      </SupplierSection>

      <ProductUnitsDrawer
        units={units}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        selectedUnitIds={values.unitIds}
        onSave={(unitIds) => onChange("unitIds", unitIds)}
      />
    </>
  );
}

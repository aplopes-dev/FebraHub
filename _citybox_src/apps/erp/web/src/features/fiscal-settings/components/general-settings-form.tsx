"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import { ConfirmationDialog, Input, toast } from "@citybox/mui";
import {
  EntityFormFooter,
  FormSection,
  SelectField,
  formFieldGridSx,
  formFieldSpanSx,
} from "@/components/ui/form";
import { REGIME_OPTIONS } from "../lib/regime-options";
import { useUnsavedChangesGuard } from "../lib/unsaved-guard";
import type {
  FiscalCompanyDto,
  FiscalEnvironment,
  FiscalTaxRegime,
  UpdateFiscalCompanyPayload,
} from "../api/fiscal-settings.dto";

const ENVIRONMENT_OPTIONS: { value: FiscalEnvironment; label: string }[] = [
  { value: "HOMOLOGATION", label: "Homologação" },
  { value: "PRODUCTION", label: "Produção" },
];

type GeneralSettingsFormProps = {
  company: FiscalCompanyDto;
  isSaving: boolean;
  onSave: (payload: UpdateFiscalCompanyPayload) => Promise<boolean>;
};

/**
 * Dados fiscais do Emitente (spec erp/012). Bloco independente do CSC — cada um
 * salva por conta própria; por isso NÃO é remontado por um save de CSC (o pai o
 * mantém montado, chaveado por `company.id`, estável).
 */
export function GeneralSettingsForm({
  company,
  isSaving,
  onSave,
}: GeneralSettingsFormProps) {
  const [taxRegime, setTaxRegime] = useState<FiscalTaxRegime>(
    company.taxRegime,
  );
  const [stateRegistration, setStateRegistration] = useState(
    company.stateRegistration ?? "",
  );
  const [municipalRegistration, setMunicipalRegistration] = useState(
    company.municipalRegistration ?? "",
  );
  const [environment, setEnvironment] = useState<FiscalEnvironment>(
    company.defaultEnvironment,
  );
  const [accountingOfficeDocument, setAccountingOfficeDocument] = useState(
    company.accountingOfficeDocument ?? "",
  );
  const [nationalNfseEnabled, setNationalNfseEnabled] = useState(
    company.nationalNfseEnabled,
  );
  const [inutilizationJustification, setInutilizationJustification] = useState(
    company.inutilizationJustification ?? "",
  );
  const [cancellationJustification, setCancellationJustification] = useState(
    company.cancellationJustification ?? "",
  );
  const [confirmProdOpen, setConfirmProdOpen] = useState(false);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  // Compara contra o prop `company` (que se atualiza no refetch): após um save
  // bem-sucedido o estado local já iguala os valores gravados → deixa de estar sujo.
  const isDirty =
    taxRegime !== company.taxRegime ||
    stateRegistration !== (company.stateRegistration ?? "") ||
    municipalRegistration !== (company.municipalRegistration ?? "") ||
    environment !== company.defaultEnvironment ||
    accountingOfficeDocument !== (company.accountingOfficeDocument ?? "") ||
    nationalNfseEnabled !== company.nationalNfseEnabled ||
    inutilizationJustification !== (company.inutilizationJustification ?? "") ||
    cancellationJustification !== (company.cancellationJustification ?? "");

  useUnsavedChangesGuard("general", isDirty);

  // Justificativa exige 15–255 caracteres quando preenchida (SEFAZ) — vazia é
  // válida (campo opcional, "ainda não defini um padrão").
  const JUSTIFICATION_MIN_LENGTH = 15;
  const JUSTIFICATION_MAX_LENGTH = 255;
  function justificationError(value: string): string | undefined {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.length < JUSTIFICATION_MIN_LENGTH) {
      return `Mínimo de ${JUSTIFICATION_MIN_LENGTH} caracteres (exigência da SEFAZ).`;
    }
    if (trimmed.length > JUSTIFICATION_MAX_LENGTH) {
      return `Máximo de ${JUSTIFICATION_MAX_LENGTH} caracteres (exigência da SEFAZ).`;
    }
    return undefined;
  }
  const inutilizationError = justificationError(inutilizationJustification);
  const cancellationError = justificationError(cancellationJustification);
  const hasJustificationError = Boolean(
    inutilizationError || cancellationError,
  );

  function buildPayload(): UpdateFiscalCompanyPayload {
    return {
      taxRegime,
      stateRegistration: stateRegistration.trim() || null,
      municipalRegistration: municipalRegistration.trim() || null,
      defaultEnvironment: environment,
      accountingOfficeDocument: accountingOfficeDocument.trim() || null,
      nationalNfseEnabled,
      inutilizationJustification: inutilizationJustification.trim() || null,
      cancellationJustification: cancellationJustification.trim() || null,
    };
  }

  async function persist() {
    const ok = await onSave(buildPayload());
    if (ok) {
      toast.success("Configurações salvas.");
      setHasSavedOnce(true);
    }
  }

  function handleSave() {
    if (!isDirty || hasJustificationError) return;
    const switchingToProduction =
      environment === "PRODUCTION" &&
      company.defaultEnvironment !== "PRODUCTION";
    if (switchingToProduction) {
      setConfirmProdOpen(true);
      return;
    }
    void persist();
  }

  /** Descarta as edições locais, voltando aos valores persistidos (`company`). */
  function handleDiscard() {
    setTaxRegime(company.taxRegime);
    setStateRegistration(company.stateRegistration ?? "");
    setMunicipalRegistration(company.municipalRegistration ?? "");
    setEnvironment(company.defaultEnvironment);
    setAccountingOfficeDocument(company.accountingOfficeDocument ?? "");
    setNationalNfseEnabled(company.nationalNfseEnabled);
    setInutilizationJustification(company.inutilizationJustification ?? "");
    setCancellationJustification(company.cancellationJustification ?? "");
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Stack spacing={5} sx={{ mt: 1 }}>
        <FormSection
          title="Informações tributárias"
          description="Regime e inscrições usados na emissão de NF-e/NFC-e/NFS-e."
        >
          <Box sx={formFieldGridSx}>
            <Box sx={formFieldSpanSx(6)}>
              <SelectField
                id="tax-regime"
                label="Regime tributário (CRT)"
                value={taxRegime}
                onChange={(value) => setTaxRegime(value as FiscalTaxRegime)}
                options={REGIME_OPTIONS}
                disabled={isSaving}
              />
            </Box>
            <Box sx={formFieldSpanSx(6)}>
              <SelectField
                id="environment"
                label="Ambiente de geração"
                value={environment}
                onChange={(value) => setEnvironment(value as FiscalEnvironment)}
                options={ENVIRONMENT_OPTIONS}
                disabled={isSaving}
              />
            </Box>
            <Box sx={formFieldSpanSx(6)}>
              <Input
                label="Inscrição Estadual"
                value={stateRegistration}
                onChange={(event) => setStateRegistration(event.target.value)}
                fullWidth
                disabled={isSaving}
              />
            </Box>
            <Box sx={formFieldSpanSx(6)}>
              <Input
                label="Inscrição Municipal"
                value={municipalRegistration}
                onChange={(event) =>
                  setMunicipalRegistration(event.target.value)
                }
                fullWidth
                disabled={isSaving}
              />
            </Box>
          </Box>
        </FormSection>

        <FormSection
          title="Informações fiscais"
          description="Documento autorizado a acessar o XML (autXML) e adesão à NFS-e nacional."
        >
          <Box sx={formFieldGridSx}>
            <Box sx={formFieldSpanSx(6)}>
              <Input
                label="Autorizado a acessar XML (CPF/CNPJ)"
                value={accountingOfficeDocument}
                onChange={(event) =>
                  setAccountingOfficeDocument(event.target.value)
                }
                fullWidth
                disabled={isSaving}
                helperText="Um único documento nesta fase (grupo autXML — a Bahia rejeita a NF-e sem ele)."
              />
            </Box>
            <Box sx={formFieldSpanSx(12)}>
              <FormControlLabel
                // ml: 0 alinha a borda esquerda do switch com a dos inputs acima
                // (o FormControlLabel do MUI tem margin-left negativa por padrão).
                sx={{ ml: 0, alignItems: "center" }}
                control={
                  <Switch
                    checked={nationalNfseEnabled}
                    onChange={(event) =>
                      setNationalNfseEnabled(event.target.checked)
                    }
                    disabled={isSaving}
                  />
                }
                label="Município aderiu à NFS-e nacional (necessário para emitir NFS-e)"
              />
            </Box>
          </Box>
        </FormSection>

        <FormSection
          title="Justificativas padrão"
          description="Textos padrão sugeridos ao inutilizar uma faixa de numeração ou cancelar um documento fiscal."
        >
          <Box sx={formFieldGridSx}>
            <Box sx={formFieldSpanSx(12)}>
              <Input
                label="Justificativa de inutilização"
                value={inutilizationJustification}
                onChange={(event) =>
                  setInutilizationJustification(event.target.value)
                }
                fullWidth
                multiline
                minRows={2}
                disabled={isSaving}
                error={Boolean(inutilizationError)}
                helperText={
                  inutilizationError ??
                  "Mínimo de 15 caracteres quando preenchida (exigência da SEFAZ)."
                }
              />
            </Box>
            <Box sx={formFieldSpanSx(12)}>
              <Input
                label="Justificativa de cancelamento"
                value={cancellationJustification}
                onChange={(event) =>
                  setCancellationJustification(event.target.value)
                }
                fullWidth
                multiline
                minRows={2}
                disabled={isSaving}
                error={Boolean(cancellationError)}
                helperText={
                  cancellationError ??
                  "Mínimo de 15 caracteres quando preenchida (exigência da SEFAZ)."
                }
              />
            </Box>
          </Box>
        </FormSection>
      </Stack>

      {/* `position: sticky` (não o slot `footer` de `FiscalScrollablePage`,
          que aqui embrulha as 5 abas de uma vez, não cada formulário) —
          `ScrollArea` é um `Box` com `overflowY: auto` simples, então um
          descendente sticky gruda no fundo DELE, não da viewport inteira.
          Verificado no código-fonte de `@citybox/mui/ScrollArea`; validar
          visualmente antes de replicar nas outras 8 telas (T017 do plano). */}
      <Box sx={{ position: "sticky", bottom: 0, zIndex: 1 }}>
        <EntityFormFooter
          mode="dirty"
          ariaLabel="Ações do formulário de dados do Emitente"
          isDirty={isDirty}
          hasSavedOnce={hasSavedOnce}
          isSaving={isSaving}
          saveDisabled={hasJustificationError}
          savedMessage="Configurações salvas"
          onCancel={() => undefined}
          onDiscard={handleDiscard}
          onSave={handleSave}
        />
      </Box>

      <ConfirmationDialog
        open={confirmProdOpen}
        loading={isSaving}
        onCancel={() => setConfirmProdOpen(false)}
        title="Mudar para ambiente de Produção?"
        description="As próximas notas serão emitidas em produção, com valor fiscal real. Confirme apenas se a loja está pronta para emitir de verdade."
        confirmLabel="Mudar para Produção"
        cancelLabel="Cancelar"
        confirmColor="error"
        onConfirm={async () => {
          await persist();
          setConfirmProdOpen(false);
        }}
      />
    </Box>
  );
}

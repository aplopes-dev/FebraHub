"use client";

import { useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { toast } from "@citybox/mui";
import {
  EntityFormFooter,
  FormSection,
  SelectField,
} from "@/components/ui/form";
import { useUnsavedChangesGuard } from "@/features/fiscal-settings/lib/unsaved-guard";
import { usePosFiscalTypeMutation } from "../hooks/use-pos-fiscal-type";
import { businessErrorMessage } from "@/lib/api/business-error-message";
import type {
  PosDocumentModel,
  PosFiscalSettingsDto,
} from "../api/pos-fiscal-type.dto";

const POS_DOCUMENT_MODELS = ["MODEL_55", "MODEL_65"] as const;

const MODEL_OPTIONS = [
  { value: "", label: "Não configurado" },
  { value: "MODEL_55", label: "Modelo 55 - NF-e" },
  { value: "MODEL_65", label: "Modelo 65 - NFC-e" },
];

/** Narrowing real (sem `as`): a string do select vira modelo válido ou null. */
function toPosDocumentModel(value: string): PosDocumentModel | null {
  return (POS_DOCUMENT_MODELS as readonly string[]).includes(value)
    ? (value as PosDocumentModel)
    : null;
}

function errorMessage(error: unknown): string {
  return businessErrorMessage(error);
}

type PosFiscalTypeFormProps = {
  config: PosFiscalSettingsDto;
  cscConfigured: boolean;
  hasValidCertificate: boolean;
};

/** Remontado (key=config.updatedAt) a cada save — reseeda do valor gravado. */
export function PosFiscalTypeForm({
  config,
  cscConfigured,
  hasValidCertificate,
}: PosFiscalTypeFormProps) {
  const initial = config.posDocumentModel ?? "";
  const [model, setModel] = useState<string>(initial);
  // "Último valor salvo": limpa a sujeira no sucesso do save (não depender só do
  // remount por refetch, que pode atrasar e contradizer o toast).
  const [savedModel, setSavedModel] = useState<string>(initial);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);
  const mutation = usePosFiscalTypeMutation();

  const isDirty = model !== savedModel;
  useUnsavedChangesGuard("pos-fiscal", isDirty);

  // BUG-06 (2026-08-13): derivado no render, não mais um `useState` setado só
  // no clique de Salvar — `cscConfigured` já está disponível assim que a tela
  // carrega, então o aviso aparece no instante em que o usuário escolhe o
  // Modelo 65, não só depois de tentar salvar.
  const cscBlock = model === "MODEL_65" && !cscConfigured;

  async function handleSave() {
    // Bloqueia Modelo 65 sem CSC (FR-004): sem CSC toda venda tentaria emitir e falharia.
    if (cscBlock) return;
    try {
      await mutation.mutateAsync({
        posDocumentModel: toPosDocumentModel(model),
      });
      setSavedModel(model);
      setHasSavedOnce(true);
      toast.success("Configuração salva.");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function handleDiscard() {
    setModel(savedModel);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column" }}>
      <Stack spacing={3} sx={{ mt: 1 }}>
        <Alert severity="info">
          <AlertTitle>Emissão no momento da operação (Lei 8.846)</AlertTitle>
          O documento fiscal deve ser emitido no ato da venda (Art. 1º e 6º).
          Configure abaixo qual modelo o PDV emite ao concluir uma venda.
        </Alert>

        {/* Aviso (não bloqueio) de certificado ausente — FR-005. */}
        {!hasValidCertificate ? (
          <Alert severity="warning">
            Não há certificado digital válido no Emitente. A configuração pode ser
            salva, mas a emissão só funcionará após enviar um certificado válido na
            aba <Link href="/configuracoes/fiscal?aba=certificado">Certificado</Link>.
          </Alert>
        ) : null}

        {cscBlock ? (
          <Alert severity="error">
            Para emitir <strong>NFC-e (Modelo 65)</strong> é necessário cadastrar o
            CSC do Emitente. Configure em{" "}
            <Link href="/configuracoes/fiscal?aba=geral">Configurações gerais</Link>{" "}
            e tente novamente.
          </Alert>
        ) : null}

        <FormSection
          title="Parâmetros fiscais"
          description="Selecione o modelo de nota fiscal que o Ponto de Venda (PDV) emitirá ao realizar uma venda, conforme a legislação aplicável."
        >
          <Stack spacing={2} sx={{ maxWidth: 480 }}>
            <SelectField
              id="pos-document-model"
              label="Tipo de NF emitida pelo PDV"
              value={model}
              onChange={(value) => setModel(value)}
              options={MODEL_OPTIONS}
              disabled={mutation.isPending}
            />

            <FormControlLabel
              control={
                <Switch
                  disabled
                  slotProps={{ input: { "aria-describedby": "icms-final-help" } }}
                />
              }
              label="ICMS para Consumidor Final (em breve)"
            />
            <Typography
              id="icms-final-help"
              variant="caption"
              color="text.secondary"
            >
              O cálculo de DIFAL não é feito pelo emissor e a venda de balcão no PDV
              é operação interna, onde DIFAL não incide — recurso em backlog.
            </Typography>
          </Stack>
        </FormSection>
      </Stack>

      {/* `position: sticky` — mesmo padrão de `general-settings-form.tsx` (T017):
          `ScrollArea` é um `Box` com `overflowY: auto` simples, um descendente
          sticky gruda no fundo dele, não da viewport inteira. */}
      <Box sx={{ position: "sticky", bottom: 0, zIndex: 1, mt: 3 }}>
        <EntityFormFooter
          mode="dirty"
          ariaLabel="Ações do formulário de tipo de NF do PDV"
          isDirty={isDirty}
          hasSavedOnce={hasSavedOnce}
          isSaving={mutation.isPending}
          saveDisabled={cscBlock}
          savedMessage="Configuração salva"
          onCancel={() => undefined}
          onDiscard={handleDiscard}
          onSave={() => void handleSave()}
        />
      </Box>
    </Box>
  );
}

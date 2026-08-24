"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormField,
} from "@citybox/mui";
import {
  ADDITIONAL_INFO_TARGETS,
  DOCUMENT_TYPE_LABEL,
  TARGET_LABEL,
  isTargetAvailable,
  maxLengthFor,
  type AdditionalInfoTarget,
  type FiscalDocumentType,
} from "@/features/fiscal-additional-info/lib/document-type-options";

const NAME_MAX = 120;

export type FiscalAdditionalInfoFormValues = {
  name: string;
  text: string;
  target: AdditionalInfoTarget;
};

export type FiscalAdditionalInfoFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  /** Documento a que a informação pertence — imutável (fixado pela aba/registro). */
  documentType: FiscalDocumentType;
  initialValues: FiscalAdditionalInfoFormValues;
  /** Muda a cada abertura para remontar o corpo (reseta o estado do form). */
  formKey: string;
  onOpenChange: (open: boolean) => void;
  onSave: (values: FiscalAdditionalInfoFormValues) => void;
  isSaving?: boolean;
};

export function FiscalAdditionalInfoFormDialog({
  open,
  mode,
  documentType,
  initialValues,
  formKey,
  onOpenChange,
  onSave,
  isSaving = false,
}: FiscalAdditionalInfoFormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!isSaving) onOpenChange(false);
      }}
      maxWidth="sm"
      fullWidth
    >
      <FiscalAdditionalInfoFormDialogBody
        key={formKey}
        mode={mode}
        documentType={documentType}
        initialValues={initialValues}
        onOpenChange={onOpenChange}
        onSave={onSave}
        isSaving={isSaving}
      />
    </Dialog>
  );
}

function FiscalAdditionalInfoFormDialogBody({
  mode,
  documentType,
  initialValues,
  onOpenChange,
  onSave,
  isSaving,
}: {
  mode: "create" | "edit";
  documentType: FiscalDocumentType;
  initialValues: FiscalAdditionalInfoFormValues;
  onOpenChange: (open: boolean) => void;
  onSave: (values: FiscalAdditionalInfoFormValues) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(initialValues.name);
  const [text, setText] = useState(initialValues.text);
  const [target, setTarget] = useState<AdditionalInfoTarget>(
    initialValues.target,
  );

  const textMax = maxLengthFor(documentType, target);
  // Trocar o Destino para um campo de teto menor pode deixar o texto já digitado
  // acima do limite (o `maxLength` do input só barra tecla nova, não o valor já
  // posto). Bloquear o Salvar e sinalizar inline evita um 400 genérico da API.
  const textOverflow = text.length > textMax;
  const nameOverflow = name.length > NAME_MAX;
  const canSave =
    Boolean(name.trim()) &&
    Boolean(text.trim()) &&
    !textOverflow &&
    !nameOverflow &&
    !isSaving;
  const documentLabel = DOCUMENT_TYPE_LABEL[documentType];

  return (
    <>
      <DialogTitle>
        {mode === "create"
          ? `Nova informação — ${documentLabel}`
          : `Editar informação — ${documentLabel}`}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          O texto entra automaticamente em toda {documentLabel} emitida, no campo
          escolhido em Destino.
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <FormField
            id="fiscal-additional-info-name"
            label="Nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
            slotProps={{ htmlInput: { maxLength: NAME_MAX } }}
            disabled={isSaving}
            autoFocus
          />

          <Box>
            <FormField
              id="fiscal-additional-info-text"
              label="Descrição"
              value={text}
              onChange={(event) => setText(event.target.value)}
              multiline
              minRows={3}
              slotProps={{ htmlInput: { maxLength: textMax } }}
              error={textOverflow}
              errorMessage={
                textOverflow
                  ? `O texto passou do limite de ${textMax} caracteres para este destino. Reduza ou troque o destino.`
                  : undefined
              }
              disabled={isSaving}
            />
            <Typography
              variant="caption"
              sx={{
                color: textOverflow ? "error.main" : "text.secondary",
                display: "block",
                mt: 0.5,
              }}
            >
              {text.length} / {textMax} caracteres
            </Typography>
          </Box>

          <FormControl disabled={isSaving}>
            <FormLabel id="fiscal-additional-info-target-label">
              Destino
            </FormLabel>
            <RadioGroup
              aria-labelledby="fiscal-additional-info-target-label"
              value={target}
              onChange={(event) =>
                setTarget(event.target.value as AdditionalInfoTarget)
              }
            >
              {ADDITIONAL_INFO_TARGETS.map((option) => {
                const available = isTargetAvailable(documentType, option);
                return (
                  <FormControlLabel
                    key={option}
                    value={option}
                    control={<Radio />}
                    disabled={isSaving || !available}
                    label={
                      available
                        ? TARGET_LABEL[option]
                        : `${TARGET_LABEL[option]} — indisponível na ${documentLabel}`
                    }
                  />
                );
              })}
            </RadioGroup>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          type="button"
          variant="outlined"
          onClick={() => onOpenChange(false)}
          disabled={isSaving}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="contained"
          disabled={!canSave}
          loading={isSaving}
          onClick={() =>
            onSave({ name: name.trim(), text: text.trim(), target })
          }
        >
          Salvar
        </Button>
      </DialogActions>
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Input,
  PasswordInput,
} from "@citybox/mui";
import { CertificateDropzone } from "./certificate-dropzone";
import type { CertificateUploadInput } from "../types/certificate";
import type { TranslatedCertificateError } from "../lib/error-translate";

type UploadModalProps = {
  open: boolean;
  title: string;
  isSubmitting: boolean;
  /** Erro de negócio já traduzido (FR-012); `null` quando não há erro. */
  errorMessage: TranslatedCertificateError | null;
  onClose: () => void;
  onSubmit: (input: CertificateUploadInput) => void;
};

/**
 * Modal de envio de certificado. A senha vive **apenas** neste estado local e é
 * descartada quando o modal fecha (FR-019) — nunca vai para cache/URL/storage.
 */
export function UploadModal({
  open,
  title,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const canSubmit = Boolean(file) && password.trim().length > 0 && !isSubmitting;

  function handleClose() {
    if (isSubmitting) return;
    onClose();
  }

  function handleSubmit() {
    // FR-011 — bloqueio client antes de chamar a API.
    if (!file) {
      setLocalError("Selecione o arquivo do certificado.");
      return;
    }
    if (!password.trim()) {
      setLocalError("Informe a senha do certificado.");
      return;
    }
    setLocalError(null);
    onSubmit({ file, password, name: name.trim() || undefined });
  }

  const shownError: TranslatedCertificateError | null = localError
    ? { message: localError }
    : errorMessage;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <CertificateDropzone
            file={file}
            disabled={isSubmitting}
            onFileSelected={(selected) => {
              setFile(selected);
              setLocalError(null);
            }}
            onClear={() => setFile(null)}
            onValidationError={(message) => setLocalError(message)}
          />

          <PasswordInput
            label="Senha do certificado"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            fullWidth
            disabled={isSubmitting}
          />

          <Input
            label="Nome / apelido (opcional)"
            value={name}
            onChange={(event) => setName(event.target.value)}
            fullWidth
            disabled={isSubmitting}
          />

          {shownError ? (
            <Alert severity="error">
              {shownError.message}
              {shownError.actionHref ? (
                <Box sx={{ mt: 0.5 }}>
                  <MuiLink component={Link} href={shownError.actionHref} onClick={handleClose}>
                    {shownError.actionLabel ?? "Ir para o cadastro"} →
                  </MuiLink>
                </Box>
              ) : null}
            </Alert>
          ) : null}

          <Typography variant="caption" color="text.secondary">
            O certificado é enviado ao ambiente de homologação. A senha não é
            armazenada.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={handleClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit} loading={isSubmitting}>
          Enviar certificado
        </Button>
      </DialogActions>
    </Dialog>
  );
}

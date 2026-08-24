"use client";

import { useState } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormField,
  toast,
} from "@citybox/mui";

type ProvisionalPasswordDialogProps = {
  open: boolean;
  email: string;
  provisionalPassword: string;
  linkedExistingAccount?: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
};

/**
 * Exibe a senha provisória gerada pela API (create / reset-password).
 * Só aparece uma vez — a API não devolve de novo.
 */
export function ProvisionalPasswordDialog({
  open,
  email,
  provisionalPassword,
  linkedExistingAccount = false,
  title = "Senha provisória",
  description = "Anote ou copie esta senha — ela só é exibida agora. No primeiro login o sistema pedirá a troca.",
  onClose,
}: ProvisionalPasswordDialogProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(provisionalPassword);
      setCopied(true);
      toast.success("Senha copiada");
    } catch {
      toast.error("Não foi possível copiar a senha");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>

          {linkedExistingAccount ? (
            <Alert severity="info">
              Já existia uma conta com este e-mail — ela foi vinculada à empresa.
              A senha provisória abaixo substitui a anterior.
            </Alert>
          ) : null}

          <FormField
            label="E-mail"
            value={email}
            slotProps={{ input: { readOnly: true } }}
          />

          <Stack direction="row" spacing={1} sx={{ alignItems: "flex-end" }}>
            <FormField
              label="Senha provisória"
              value={provisionalPassword}
              slotProps={{ input: { readOnly: true } }}
              sx={{ flex: 1 }}
            />
            <Button
              type="button"
              variant="outlined"
              startIcon={<ContentCopyIcon fontSize="small" />}
              onClick={() => void handleCopy()}
            >
              {copied ? "Copiada" : "Copiar"}
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button type="button" variant="contained" onClick={onClose}>
          Entendi
        </Button>
      </DialogActions>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { Button, CircularProgress, Dialog, TextField } from "@mui/material";
import {
  ConversasDialogActions,
  ConversasDialogContent,
  ConversasDialogHeader,
  conversasDialogPaperSx,
  conversasFieldSx,
} from "@/components/common/dialog-form-ui";
import { useCreateConversationMutation } from "@/hooks/conversations/use-conversation-mutations";
import type { ConversationDto } from "@/types/api/conversation";

type CreateConversationDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Chamado com a conversa criada (ou encontrada) — a view seleciona. */
  onCreated: (conversation: ConversationDto) => void;
};

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function CreateConversationDialogBody({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (conversation: ConversationDto) => void;
}) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const createMutation = useCreateConversationMutation();

  const digits = onlyDigits(phone);
  const canSubmit = digits.length >= 10 && !createMutation.isPending;

  const handleConfirm = () => {
    if (!canSubmit) return;
    setError(null);
    createMutation.mutate(
      { phone: phone.trim(), ...(name.trim() ? { name: name.trim() } : {}) },
      {
        onSuccess: (conversation) => {
          onCreated(conversation);
        },
        onError: (err) => {
          const message =
            err instanceof Error && err.message.trim()
              ? err.message
              : "Não foi possível criar a conversa. Verifique o telefone.";
          setError(message);
        },
      },
    );
  };

  return (
    <>
      <ConversasDialogHeader
        icon={<WhatsAppIcon />}
        title="Nova conversa"
        description="Informe o telefone do contato para iniciar (ou retomar) o atendimento no WhatsApp."
      />

      <ConversasDialogContent>
        <TextField
          label="Telefone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
          fullWidth
          autoFocus
          placeholder="(11) 99999-9999"
          sx={conversasFieldSx}
          error={Boolean(error)}
          helperText={error ?? "Com DDD; validamos se o número existe no WhatsApp."}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleConfirm();
            }
          }}
        />

        <TextField
          label="Nome (opcional)"
          value={name}
          onChange={(event) => setName(event.target.value)}
          fullWidth
          placeholder="Nome do contato"
          sx={conversasFieldSx}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleConfirm();
            }
          }}
        />
      </ConversasDialogContent>

      <ConversasDialogActions>
        <Button
          onClick={onClose}
          color="secondary"
          disabled={createMutation.isPending}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={!canSubmit}
          onClick={handleConfirm}
          startIcon={
            createMutation.isPending ? (
              <CircularProgress size={14} color="inherit" />
            ) : null
          }
        >
          Iniciar conversa
        </Button>
      </ConversasDialogActions>
    </>
  );
}

export default function CreateConversationDialog({
  open,
  onClose,
  onCreated,
}: CreateConversationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: conversasDialogPaperSx } }}
    >
      {open ? (
        <CreateConversationDialogBody
          key="open"
          onClose={onClose}
          onCreated={onCreated}
        />
      ) : null}
    </Dialog>
  );
}

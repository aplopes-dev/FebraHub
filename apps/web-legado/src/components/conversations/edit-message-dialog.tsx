"use client";

import { useState } from "react";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Button, Dialog, TextField } from "@mui/material";
import {
  ConversasDialogActions,
  ConversasDialogContent,
  ConversasDialogHeader,
  conversasDialogPaperSx,
  conversasFieldSx,
} from "@/components/common/dialog-form-ui";
import type { ChatMessageDto } from "@/types/api/conversation";

type EditMessageDialogProps = {
  /** Mensagem em edição, ou null quando fechado. */
  message: ChatMessageDto | null;
  onClose: () => void;
  /** Persiste o novo texto; rejeitar mantém o diálogo aberto. */
  onSave: (message: ChatMessageDto, contentText: string) => Promise<void>;
};

function EditMessageDialogBody({
  message,
  onClose,
  onSave,
}: {
  message: ChatMessageDto;
  onClose: () => void;
  onSave: (message: ChatMessageDto, contentText: string) => Promise<void>;
}) {
  const [text, setText] = useState(message.contentText ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed === (message.contentText ?? "").trim()) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await onSave(message, trimmed);
      onClose();
    } catch {
      // erro já tratado pelo chamador (snackbar); mantém o diálogo aberto
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ConversasDialogHeader
        icon={<EditOutlinedIcon />}
        title="Editar mensagem"
        description="O texto será atualizado para todos na conversa."
      />
      <ConversasDialogContent>
        <TextField
          value={text}
          onChange={(event) => setText(event.target.value)}
          multiline
          minRows={3}
          maxRows={8}
          fullWidth
          autoFocus
          sx={conversasFieldSx}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSave();
            }
          }}
        />
      </ConversasDialogContent>
      <ConversasDialogActions>
        <Button color="secondary" disabled={saving} onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={saving || !text.trim()}
          onClick={() => void handleSave()}
        >
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </ConversasDialogActions>
    </>
  );
}

export default function EditMessageDialog({
  message,
  onClose,
  onSave,
}: EditMessageDialogProps) {
  return (
    <Dialog
      open={Boolean(message)}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: conversasDialogPaperSx } }}
    >
      {message ? (
        <EditMessageDialogBody
          key={message.id}
          message={message}
          onClose={onClose}
          onSave={onSave}
        />
      ) : null}
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import AddCommentOutlinedIcon from "@mui/icons-material/AddCommentOutlined";
import { Button, CircularProgress, Dialog, TextField } from "@mui/material";
import {
  ConversasDialogActions,
  ConversasDialogContent,
  ConversasDialogHeader,
  conversasDialogPaperSx,
  conversasFieldSx,
} from "@/components/common/dialog-form-ui";

type RegisterCustomerActivityDialogProps = {
  open: boolean;
  customerName: string;
  pending?: boolean;
  onClose: () => void;
  onConfirm: (text: string) => void;
};

function RegisterCustomerActivityDialogBody({
  customerName,
  pending = false,
  onClose,
  onConfirm,
}: Omit<RegisterCustomerActivityDialogProps, "open">) {
  const [text, setText] = useState("");

  const canSubmit = text.trim().length > 0 && !pending;

  return (
    <>
      <ConversasDialogHeader
        icon={<AddCommentOutlinedIcon />}
        title="Registrar atividade"
        description={`Nota na timeline de ${customerName}.`}
      />
      <ConversasDialogContent>
        <TextField
          autoFocus
          label="Atividade"
          placeholder="Ex.: Ligação — alinhou proposta e pediu retorno amanhã."
          value={text}
          onChange={(event) => setText(event.target.value)}
          fullWidth
          multiline
          minRows={3}
          disabled={pending}
          sx={conversasFieldSx}
        />
      </ConversasDialogContent>
      <ConversasDialogActions>
        <Button onClick={onClose} color="secondary" disabled={pending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={!canSubmit}
          onClick={() => onConfirm(text.trim())}
          startIcon={
            pending ? <CircularProgress size={14} color="inherit" /> : null
          }
        >
          Salvar
        </Button>
      </ConversasDialogActions>
    </>
  );
}

export default function RegisterCustomerActivityDialog({
  open,
  customerName,
  pending = false,
  onClose,
  onConfirm,
}: RegisterCustomerActivityDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={pending ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: conversasDialogPaperSx } }}
    >
      {open ? (
        <RegisterCustomerActivityDialogBody
          key={String(open)}
          customerName={customerName}
          pending={pending}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      ) : null}
    </Dialog>
  );
}

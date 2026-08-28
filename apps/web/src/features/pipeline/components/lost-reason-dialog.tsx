"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Input,
  MenuItem,
  Select,
  Stack,
} from "@/ui";
import { LOST_REASONS } from "@/lib/mock-db";

export type LostReasonDialogProps = {
  open: boolean;
  personName?: string;
  onCancel: () => void;
  onConfirm: (reasonId: string, note: string) => void;
};

/**
 * Perder oportunidade **exige motivo**.
 *
 * O formulário zera por remontagem: quem abre passa uma `key` que muda a cada
 * abertura. Sai mais barato que sincronizar estado com efeito — e não existe
 * render intermediário com o motivo da perda anterior.
 *
 * Não é burocracia: motivo de perda é o único dado que responde por que a
 * escada quebra — e ele só existe se for pedido no momento em que a pessoa
 * ainda lembra. A etapa de perda é marcada como `requiresReason` no cadastro;
 * esta caixa é o que honra essa marca na tela.
 */
export function LostReasonDialog({
  open,
  personName,
  onCancel,
  onConfirm,
}: LostReasonDialogProps) {
  const [reasonId, setReasonId] = useState(LOST_REASONS[0]?.id ?? "");
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>Por que esta oportunidade foi perdida?</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {personName
            ? `Registrando a perda de ${personName}.`
            : "Registrando a perda."}{" "}
          O motivo aparece no relatório de perdas e na ficha.
        </DialogContentText>
        <Stack spacing={2}>
          <Select
            size="small"
            value={reasonId}
            onChange={(event) => setReasonId(String(event.target.value))}
            fullWidth
            inputProps={{ "aria-label": "Motivo da perda" }}
          >
            {LOST_REASONS.map((reason) => (
              <MenuItem key={reason.id} value={reason.id}>
                {reason.name}
              </MenuItem>
            ))}
          </Select>
          <Input
            size="small"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Detalhe (opcional) — o que a pessoa disse"
            multiline
            minRows={2}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button type="button" variant="text" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="contained"
          color="error"
          disabled={!reasonId}
          onClick={() => onConfirm(reasonId, note)}
        >
          Registrar perda
        </Button>
      </DialogActions>
    </Dialog>
  );
}

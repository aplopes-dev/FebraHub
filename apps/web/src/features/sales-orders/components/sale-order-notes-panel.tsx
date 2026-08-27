"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormField,
} from "@/ui";
import { formSectionBoxSx } from "@/components/ui/form";
import { SALE_ORDER_NOTES_MAX_LENGTH } from "@/features/sales-orders/types/sale-order-form";

type SaleOrderNotesPanelProps = {
  notes: string;
  disabled?: boolean;
  onNotesChange: (notes: string) => void;
};

export function SaleOrderNotesPanel({
  notes,
  disabled = false,
  onNotesChange,
}: SaleOrderNotesPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={{ ...formSectionBoxSx }}>
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", justifyContent: "space-between" }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Observações da venda
          </Typography>
          <Button
            type="button"
            variant="text"
            disabled={disabled}
            onClick={() => setOpen(true)}
            sx={{ px: 0 }}
          >
            Editar
          </Button>
        </Stack>

        {notes.trim() ? (
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {notes}
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Nenhuma observação adicionada
          </Typography>
        )}
      </Stack>

      <Dialog
        open={!disabled && open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {!disabled && open ? (
          <NotesForm
            initialValue={notes}
            onApply={onNotesChange}
            onClose={() => setOpen(false)}
          />
        ) : null}
      </Dialog>
    </Box>
  );
}

function NotesForm({
  initialValue,
  onApply,
  onClose,
}: {
  initialValue: string;
  onApply: (notes: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initialValue);

  function handleApply() {
    onApply(draft.slice(0, SALE_ORDER_NOTES_MAX_LENGTH));
    onClose();
  }

  return (
    <>
      <DialogTitle>Observações da venda</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Adicione informações extras sobre este pedido.
        </Typography>
        <FormField
          id="sale-order-notes"
          label="Observação"
          value={draft}
          onChange={(event) =>
            setDraft(event.target.value.slice(0, SALE_ORDER_NOTES_MAX_LENGTH))
          }
          multiline
          minRows={5}
          placeholder="Digite as observações…"
          helperText={`${draft.length}/${SALE_ORDER_NOTES_MAX_LENGTH}`}
        />
      </DialogContent>
      <DialogActions>
        <Button type="button" variant="outlined" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" variant="contained" onClick={handleApply}>
          Salvar
        </Button>
      </DialogActions>
    </>
  );
}

"use client";

import { useState } from "react";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { Button, ConfirmationDialog, Typography } from "@citybox/mui";
import { useBulkDeleteProductsMutation } from "@/features/products/hooks/use-product-mutations";
import { surfaceBorderRadius } from "@/theme/surface-styles";

type ProductSelectionBarProps = {
  selectedIds: Set<string>;
  onClear: () => void;
};

export function ProductSelectionBar({
  selectedIds,
  onClear,
}: ProductSelectionBarProps) {
  const count = selectedIds.size;
  const [confirmOpen, setConfirmOpen] = useState(false);
  const bulkDelete = useBulkDeleteProductsMutation();

  if (count === 0) return null;

  function handleConfirmDelete() {
    const ids = [...selectedIds];
    bulkDelete.mutate(ids, {
      onSuccess: () => {
        onClear();
        setConfirmOpen(false);
      },
    });
  }

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
          px: 2,
          py: 1.25,
          borderRadius: surfaceBorderRadius,
          bgcolor: "action.hover",
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {count === 1
            ? "1 produto selecionado"
            : `${count} produtos selecionados`}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Button type="button" variant="outlined" size="small" onClick={onClear}>
            Limpar seleção
          </Button>
          <Button
            type="button"
            variant="contained"
            color="error"
            size="small"
            disabled={bulkDelete.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            Excluir selecionados
          </Button>
        </Stack>
      </Paper>

      <ConfirmationDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        title={
          count === 1
            ? "Excluir produto selecionado?"
            : `Excluir ${count} produtos selecionados?`
        }
        description="Os produtos serão movidos para a lixeira e poderão ser restaurados depois."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        confirmColor="error"
        loading={bulkDelete.isPending}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

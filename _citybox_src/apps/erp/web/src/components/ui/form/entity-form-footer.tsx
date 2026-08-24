"use client";

import { useState, type ReactNode } from "react";
import { Box, Button, ConfirmationDialog, Typography } from "@citybox/mui";

export type EntityFormFooterProps = {
  ariaLabel?: string;
  /** Modo simples: Cancelar + Salvar (sem indicador dirty). */
  mode?: "simple" | "dirty";
  isDirty?: boolean;
  hasSavedOnce?: boolean;
  isSaving?: boolean;
  cancelLabel?: string;
  saveLabel?: string;
  savedMessage?: string;
  dirtyMessage?: string;
  onCancel: () => void;
  onSave: () => void;
  /** Desabilita o botão principal (modo simples). */
  saveDisabled?: boolean;
  onDiscard?: () => void;
  /** Slot à esquerda (ex.: total do pedido). */
  leading?: ReactNode;
};

const footerSx = {
  zIndex: 0,
  display: "flex",
  flexShrink: 0,
  alignItems: "center",
  justifyContent: "space-between",
  gap: 2,
  width: "100%",
  borderTop: 1,
  borderColor: "divider",
  bgcolor: "background.paper",
  px: 3,
  pt: 1.5,
  pb: "max(0.75rem, env(safe-area-inset-bottom))",
  boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.04)",
} as const;

export function EntityFormFooter({
  ariaLabel = "Ações do formulário",
  mode = "simple",
  isDirty = false,
  hasSavedOnce = false,
  isSaving = false,
  cancelLabel = "Cancelar",
  saveLabel = "Salvar",
  savedMessage = "Salvo",
  dirtyMessage = "Você tem alterações não salvas",
  onCancel,
  onSave,
  saveDisabled = false,
  onDiscard,
  leading,
}: EntityFormFooterProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isDirtyMode = mode === "dirty";

  function handleCancelClick() {
    if (isDirtyMode && isDirty && onDiscard) {
      setConfirmOpen(true);
      return;
    }
    onCancel();
  }

  return (
    <>
      <Box component="footer" role="toolbar" aria-label={ariaLabel} sx={footerSx}>
        <Box sx={{ minWidth: 0, flex: 1 }} aria-live="polite">
          {leading}
          {!leading && isDirtyMode ? (
            isDirty ? (
              <Typography
                variant="body2"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  color: "warning.dark",
                }}
              >
                <Box
                  component="span"
                  aria-hidden
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "warning.main",
                  }}
                />
                {dirtyMessage}
              </Typography>
            ) : hasSavedOnce ? (
              <Typography
                variant="body2"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  color: "success.dark",
                }}
              >
                <Box
                  component="span"
                  aria-hidden
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "success.main",
                  }}
                />
                {savedMessage}
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                &nbsp;
              </Typography>
            )
          ) : null}
        </Box>

        <Box sx={{ display: "flex", flexShrink: 0, alignItems: "center", gap: 1 }}>
          <Button
            type="button"
            variant="outlined"
            disabled={isDirtyMode ? !isDirty || isSaving : isSaving}
            onClick={handleCancelClick}
          >
            {isDirtyMode && isDirty ? "Descartar alterações" : cancelLabel}
          </Button>
          <Button
            type="button"
            variant="contained"
            loading={isSaving}
            disabled={
              isDirtyMode
                ? !isDirty || isSaving || saveDisabled
                : isSaving || saveDisabled
            }
            onClick={onSave}
          >
            {saveLabel}
          </Button>
        </Box>
      </Box>

      {isDirtyMode && onDiscard ? (
        <ConfirmationDialog
          open={confirmOpen}
          title="Descartar alterações?"
          description="As alterações não salvas serão perdidas. Esta ação não pode ser desfeita."
          confirmLabel="Descartar"
          cancelLabel="Continuar editando"
          confirmColor="error"
          onConfirm={() => {
            onDiscard();
            setConfirmOpen(false);
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      ) : null}
    </>
  );
}

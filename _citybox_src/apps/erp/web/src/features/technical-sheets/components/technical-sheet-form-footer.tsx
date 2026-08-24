"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import { Button, ConfirmationDialog, Typography } from "@citybox/mui";

type TechnicalSheetFormFooterProps = {
  isDirty: boolean;
  hasSavedOnce: boolean;
  isSaving?: boolean;
  onDiscard: () => void;
  onSave: () => void;
};

export function TechnicalSheetFormFooter({
  isDirty,
  hasSavedOnce,
  isSaving = false,
  onDiscard,
  onSave,
}: TechnicalSheetFormFooterProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleDiscardClick() {
    if (!isDirty) return;
    setConfirmOpen(true);
  }

  return (
    <>
      <Box
        component="footer"
        role="toolbar"
        aria-label="Ações da ficha técnica"
        sx={{
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
          boxShadow: "0 -4px 12px rgba(0,0,0,0.04)",
        }}
      >
        <Box sx={{ minWidth: 0 }} aria-live="polite">
          {isDirty ? (
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
                  flexShrink: 0,
                }}
              />
              Você tem alterações não salvas
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
                  flexShrink: 0,
                }}
              />
              Ficha técnica salva
            </Typography>
          ) : (
            <Typography variant="body2" sx={{
              color: "text.secondary"
            }}>
              &nbsp;
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", flexShrink: 0, alignItems: "center", gap: 1 }}>
          <Button
            type="button"
            variant="text"
            disabled={!isDirty || isSaving}
            onClick={handleDiscardClick}
          >
            Descartar alterações
          </Button>
          <Button
            type="button"
            variant="contained"
            disabled={!isDirty || isSaving}
            loading={isSaving}
            onClick={onSave}
          >
            Salvar
          </Button>
        </Box>
      </Box>
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
    </>
  );
}

"use client";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckIcon from "@mui/icons-material/Check";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { Button } from "@citybox/mui";
import { getPromotionTypeMeta } from "@/features/promotions/lib/promotion-type-catalog";
import type { PromotionType } from "@/features/promotions/types/promotion";

type PromotionFormFooterProps = {
  selectedType: PromotionType | null;
  isFirstStep: boolean;
  isLastStep: boolean;
  canAdvance: boolean;
  saveLabel?: string;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
};

export function PromotionFormFooter({
  selectedType,
  isFirstStep,
  isLastStep,
  canAdvance,
  saveLabel = "Salvar promoção",
  onBack,
  onNext,
  onSave,
}: PromotionFormFooterProps) {
  const meta = selectedType ? getPromotionTypeMeta(selectedType) : null;
  const Icon = meta?.icon;

  return (
    <Box
      component="footer"
      role="toolbar"
      aria-label="Ações do formulário de promoção"
      sx={{
        zIndex: 20,
        display: "flex",
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        px: 3,
        pt: 1.5,
        pb: "max(0.75rem, env(safe-area-inset-bottom))",
        boxShadow: "0 -4px 12px rgba(0,0,0,0.04)",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {meta && Icon ? (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: 1,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
              }}
            >
              <Icon sx={{ fontSize: 20 }} aria-hidden />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "text.secondary",
                }}
              >
                Promoção selecionada
              </Typography>
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {meta.title}
              </Typography>
              <Typography
                variant="caption"
                noWrap
                sx={{ color: "text.secondary", display: "block" }}
              >
                {meta.tagline}
              </Typography>
            </Box>
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Selecione um tipo de promoção para continuar.
          </Typography>
        )}
      </Box>

      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
        <Button
          type="button"
          size="large"
          variant="outlined"
          disabled={isFirstStep}
          startIcon={<ArrowBackIcon fontSize="small" />}
          onClick={onBack}
        >
          Voltar
        </Button>

        {isLastStep ? (
          <Button
            type="button"
            size="large"
            variant="contained"
            startIcon={<CheckIcon fontSize="small" />}
            onClick={onSave}
          >
            {saveLabel}
          </Button>
        ) : (
          <Button
            type="button"
            size="large"
            variant="contained"
            disabled={!canAdvance}
            endIcon={<ArrowForwardIcon fontSize="small" />}
            onClick={onNext}
          >
            Continuar
          </Button>
        )}
      </Stack>
    </Box>
  );
}

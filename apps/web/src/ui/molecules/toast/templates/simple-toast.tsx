"use client";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import CloseIcon from "@mui/icons-material/Close";
import { Typography } from "../../../atoms/typography";
import { Icon } from "../../../icons/icon";
import type { IconName } from "../../../icons/registry";
import { TOAST_ICON_COLORS } from "../toast-colors";
import type { ToastTemplateProps, ToastVariant } from "../types";

const VARIANT_ICONS: Record<ToastVariant, IconName> = {
  success: "check",
  error: "close",
  info: "info",
  warning: "warning",
};

/**
 * Template simples — mesmo card do tema, sem barra de progresso.
 */
export function SimpleToastTemplate({
  title,
  description,
  variant,
  onDismiss,
}: ToastTemplateProps) {
  return (
    <Box
      role="status"
      sx={{
        width: { xs: "100%", sm: 360 },
        maxWidth: "100%",
        borderRadius: 1,
        bgcolor: "background.paper",
        color: "text.primary",
        border: 1,
        borderColor: "divider",
        boxShadow: 3,
      }}
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ alignItems: "flex-start", px: 1.75, py: 1.5, pr: 1 }}
      >
        <Box
          sx={{
            mt: 0.25,
            flexShrink: 0,
            display: "flex",
            color: TOAST_ICON_COLORS[variant],
          }}
        >
          <Icon name={VARIANT_ICONS[variant]} size={20} variant="bold" />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, pt: 0.125 }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, lineHeight: 1.35 }}
          >
            {title}
          </Typography>
          {description ? (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 0.5,
                color: "text.secondary",
                lineHeight: 1.4,
              }}
            >
              {description}
            </Typography>
          ) : null}
        </Box>

        <IconButton
          type="button"
          size="small"
          aria-label="Fechar notificação"
          onClick={onDismiss}
          sx={{ mt: -0.25, color: "text.secondary" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  );
}

"use client";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import CloseIcon from "@mui/icons-material/Close";
import { Typography } from "../../../atoms/typography";
import { Icon } from "../../../icons/icon";
import type { IconName } from "../../../icons/registry";
import {
  TOAST_ICON_COLORS,
  TOAST_PROGRESS_COLORS,
} from "../toast-colors";
import type { ToastTemplateProps, ToastVariant } from "../types";

const VARIANT_ICONS: Record<ToastVariant, IconName> = {
  success: "check",
  error: "close",
  info: "info",
  warning: "warning",
};

/**
 * Template default: card do tema + barra de progresso pastel
 * que esvazia durante o tempo de exibição.
 */
export function ProgressToastTemplate({
  title,
  description,
  variant,
  duration,
  onDismiss,
}: ToastTemplateProps) {
  const progressColor = TOAST_PROGRESS_COLORS[variant];
  const iconColor = TOAST_ICON_COLORS[variant];

  return (
    <Box
      role="status"
      sx={{
        position: "relative",
        overflow: "hidden",
        width: { xs: "100%", sm: 360 },
        maxWidth: "100%",
        borderRadius: 1,
        bgcolor: "background.paper",
        color: "text.primary",
        border: 1,
        borderColor: "divider",
        boxShadow: 3,
        "&:hover .toast-progress-bar": {
          animationPlayState: "paused",
        },
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
            color: iconColor,
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

      <Box
        className="toast-progress-bar"
        sx={{
          position: "absolute",
          left: 0,
          bottom: 0,
          height: 3,
          width: "100%",
          bgcolor: progressColor,
          transformOrigin: "left center",
          animation: `citybox-toast-shrink ${duration}ms linear forwards`,
          "@keyframes citybox-toast-shrink": {
            from: { transform: "scaleX(1)" },
            to: { transform: "scaleX(0)" },
          },
          "@media (prefers-reduced-motion: reduce)": {
            animation: "none",
            transform: "scaleX(0.15)",
          },
        }}
      />
    </Box>
  );
}

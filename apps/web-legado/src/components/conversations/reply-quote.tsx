"use client";

import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, Typography } from "@mui/material";

type ReplyQuoteProps = {
  /** Rótulo do autor da mensagem citada ("Você" ou nome do contato). */
  authorLabel: string;
  /** Preview compacto (texto ou placeholder de mídia). */
  preview: string;
  /** Presente → variante "chip do composer" com botão X. */
  onDismiss?: () => void;
  /** Clique na citação (rolar até a mensagem original). */
  onClick?: () => void;
};

export default function ReplyQuote({
  authorLabel,
  preview,
  onDismiss,
  onClick,
}: ReplyQuoteProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        px: 1.25,
        py: 0.75,
        mb: onDismiss ? 0 : 0.75,
        borderLeft: "3px solid",
        borderColor: "primary.main",
        borderRadius: "8px",
        bgcolor:
          "color-mix(in srgb, var(--mui-palette-text-primary) 6%, transparent)",
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick
          ? {
              bgcolor:
                "color-mix(in srgb, var(--mui-palette-text-primary) 10%, transparent)",
            }
          : undefined,
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          variant="caption"
          noWrap
          sx={{ display: "block", fontWeight: 700, color: "primary.main" }}
        >
          {authorLabel}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            overflowWrap: "anywhere",
            color: "text.secondary",
          }}
        >
          {preview}
        </Typography>
      </Box>
      {onDismiss ? (
        <IconButton
          size="small"
          aria-label="Cancelar resposta"
          onClick={(event) => {
            event.stopPropagation();
            onDismiss();
          }}
          sx={{ flexShrink: 0 }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      ) : null}
    </Box>
  );
}

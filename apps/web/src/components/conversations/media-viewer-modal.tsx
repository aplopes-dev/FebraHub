"use client";

import CloseIcon from "@mui/icons-material/Close";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  IconButton,
  Typography,
} from "@mui/material";
import { useState } from "react";
import {
  downloadMessageAttachment,
  useMessageMediaUrl,
} from "@/hooks/conversations/use-message-actions";

export type MediaViewerKind = "image" | "video" | "audio" | "pdf";

type MediaViewerModalProps = {
  open: boolean;
  onClose: () => void;
  kind: MediaViewerKind;
  /** Id da mensagem dona da mídia — a URL assinada é buscada na hora. */
  messageId: string | null;
  title?: string;
};

/**
 * Viewer full-screen de mídia (imagem/vídeo/áudio/PDF via iframe) com
 * loading/erro e botão de download (URL assinada com disposition=attachment).
 */
export default function MediaViewerModal({
  open,
  onClose,
  kind,
  messageId,
  title,
}: MediaViewerModalProps) {
  const media = useMessageMediaUrl(open ? messageId : null);
  const [downloading, setDownloading] = useState(false);

  const label = title || "Mídia";
  const url = media.data?.downloadUrl ?? null;

  const handleDownload = async () => {
    if (!messageId || downloading) return;
    setDownloading(true);
    try {
      await downloadMessageAttachment(messageId);
    } catch (error) {
      console.error("[conversas] download de mídia", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: "14px",
            overflow: "hidden",
            maxHeight: "92vh",
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1.25,
          borderBottom: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Typography
          variant="subtitle2"
          noWrap
          sx={{ fontWeight: 700, minWidth: 0, flex: 1 }}
        >
          {label}
        </Typography>
        <Button
          size="small"
          color="secondary"
          startIcon={
            downloading ? (
              <CircularProgress size={14} color="inherit" />
            ) : (
              <DownloadOutlinedIcon fontSize="small" />
            )
          }
          disabled={downloading || !messageId}
          onClick={handleDownload}
          sx={{ textTransform: "none", fontWeight: 600, flexShrink: 0 }}
        >
          Baixar
        </Button>
        <IconButton size="small" aria-label="Fechar" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 280,
          display: "grid",
          placeItems: "center",
          overflow: "auto",
          p: kind === "pdf" ? 0 : 2,
          bgcolor:
            "color-mix(in srgb, var(--mui-palette-common-black) 4%, var(--mui-palette-background-default))",
        }}
      >
        {media.isLoading ? (
          <Box sx={{ display: "grid", placeItems: "center", gap: 1 }}>
            <CircularProgress size={28} />
            <Typography variant="caption" color="text.secondary">
              Carregando mídia...
            </Typography>
          </Box>
        ) : media.isError || !url ? (
          <Box sx={{ display: "grid", placeItems: "center", gap: 1 }}>
            <ImageNotSupportedOutlinedIcon
              sx={{ fontSize: 40, color: "text.disabled" }}
            />
            <Typography variant="body2" color="text.secondary">
              Não foi possível carregar a mídia.
            </Typography>
          </Box>
        ) : kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL assinada e efêmera; next/image não otimiza cross-origin dinâmico
          <img
            src={url}
            alt={label}
            style={{
              maxWidth: "100%",
              maxHeight: "78vh",
              objectFit: "contain",
              borderRadius: 8,
            }}
          />
        ) : kind === "video" ? (
          <video
            src={url}
            controls
            autoPlay
            style={{
              maxWidth: "100%",
              maxHeight: "78vh",
              borderRadius: 8,
              backgroundColor: "#000",
            }}
          />
        ) : kind === "audio" ? (
          <audio src={url} controls autoPlay style={{ width: "100%", maxWidth: 520 }} />
        ) : (
          <iframe
            src={url}
            title={label}
            style={{
              width: "100%",
              height: "78vh",
              border: 0,
              display: "block",
            }}
          />
        )}
      </Box>
    </Dialog>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import AudiotrackOutlinedIcon from "@mui/icons-material/AudiotrackOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import MicNoneOutlinedIcon from "@mui/icons-material/MicNoneOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import VideocamOutlinedIcon from "@mui/icons-material/VideocamOutlined";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ReplyQuote from "./reply-quote";
import { enqueueConversationMediaUpload } from "@/lib/uploads/enqueue-conversation-media-upload";
import type {
  ConversationMediaKind,
  SendMediaDescriptor,
} from "@/types/api/conversation";

/** Limite de legenda (espelha o cap do WhatsApp). */
export const MEDIA_CAPTION_MAX = 1024;

/** Cap de gravação de nota de voz (5 min). */
const MAX_RECORDING_SECONDS = 5 * 60;

/** Worker que codifica o mic em Ogg/Opus 100% no browser (em /public). */
const OPUS_ENCODER_PATH = "/opus/encoderWorker.min.js";

/** Limites por tipo: imagem 5MB, resto 16MB. */
const MEDIA_MAX_BYTES: Record<ConversationMediaKind, number> = {
  image: 5 * 1024 * 1024,
  video: 16 * 1024 * 1024,
  audio: 16 * 1024 * 1024,
  document: 16 * 1024 * 1024,
};

const PICKER_ACCEPT: Record<ConversationMediaKind, string> = {
  image: "image/png,image/jpeg,image/webp",
  video: "video/mp4,video/3gpp",
  audio: "audio/*",
  document:
    "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv",
};

export type ReplyDraft = {
  id: string;
  authorLabel: string;
  preview: string;
};

export type ComposerSendMediaPayload = {
  descriptor: SendMediaDescriptor;
  caption?: string;
  replyToMessageId?: string;
  /** Object URL do arquivo local para preview otimista da bolha. */
  localPreviewUrl?: string;
};

type MediaDraft = {
  kind: ConversationMediaKind;
  file: File;
  previewUrl: string;
  caption: string;
  voiceNote: boolean;
};

type MessageComposerProps = {
  conversationId: string;
  replyTo: ReplyDraft | null;
  onClearReply: () => void;
  onSendText: (text: string, replyToMessageId?: string) => void;
  onSendMedia: (payload: ComposerSendMediaPayload) => void;
  onError: (message: string) => void;
};

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function MessageComposer({
  conversationId,
  replyTo,
  onClearReply,
  onSendText,
  onSendMedia,
  onError,
}: MessageComposerProps) {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<MediaDraft | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [attachAnchor, setAttachAnchor] = useState<HTMLElement | null>(null);

  // ---- Gravação de nota de voz (Ogg/Opus no browser) ------------------
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recorderRef = useRef<import("opus-recorder").default | null>(null);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Espelho do draft para o cleanup de unmount (não lê estado de render).
  const draftRef = useRef<MediaDraft | null>(null);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Libera mic/timer/objectURL ao desmontar.
  useEffect(() => {
    return () => {
      clearTimer();
      cancelledRef.current = true;
      void recorderRef.current?.stop().catch(() => {});
      const staged = draftRef.current;
      if (staged) URL.revokeObjectURL(staged.previewUrl);
    };
  }, [clearTimer]);

  const stageFile = useCallback(
    (kind: ConversationMediaKind, file: File, voiceNote = false) => {
      const max = MEDIA_MAX_BYTES[kind];
      if (file.size > max) {
        const limitMb = Math.round(max / (1024 * 1024));
        onError(
          `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Limite: ${limitMb} MB.`,
        );
        return;
      }
      setDraft((current) => {
        if (current) URL.revokeObjectURL(current.previewUrl);
        return {
          kind,
          file,
          previewUrl: URL.createObjectURL(file),
          caption: "",
          voiceNote,
        };
      });
    },
    [onError],
  );

  const handlePicked = useCallback(
    (kind: ConversationMediaKind, file: File | undefined) => {
      if (file) stageFile(kind, file);
    },
    [stageFile],
  );

  const discardDraft = useCallback(() => {
    setDraft((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  }, []);

  // ---- Envio ----------------------------------------------------------

  const handleSendText = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSendText(trimmed, replyTo?.id);
    setText("");
    onClearReply();
  }, [text, replyTo?.id, onSendText, onClearReply]);

  const handleSendDraft = useCallback(async () => {
    if (!draft || uploading) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const descriptor = await enqueueConversationMediaUpload(
        conversationId,
        draft.file,
        draft.kind,
        {
          voiceNote: draft.voiceNote,
          onProgress: setUploadProgress,
        },
      );
      const caption =
        draft.kind === "audio" ? undefined : draft.caption.trim() || undefined;
      onSendMedia({
        descriptor,
        caption,
        replyToMessageId: replyTo?.id,
        // A partir daqui o objectURL pertence ao preview otimista da bolha.
        localPreviewUrl: draft.previewUrl,
      });
      setDraft(null);
      onClearReply();
    } catch (error) {
      console.error("[conversas] upload de mídia", error);
      onError("Não foi possível enviar o arquivo. Tente novamente.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [
    draft,
    uploading,
    conversationId,
    replyTo,
    onSendMedia,
    onClearReply,
    onError,
  ]);

  // ---- Gravação -------------------------------------------------------

  const finalizeRecording = useCallback(
    (bytes: Uint8Array) => {
      const file = new File(
        [bytes as unknown as BlobPart],
        `voz-${Date.now()}.ogg`,
        { type: "audio/ogg" },
      );
      if (file.size === 0) return;
      stageFile("audio", file, true);
    },
    [stageFile],
  );

  const startRecording = useCallback(async () => {
    if (recording || uploading) return;
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof AudioContext === "undefined"
    ) {
      onError("Gravação de voz não é suportada neste navegador.");
      return;
    }
    try {
      // Carrega o encoder (~400 KB) só quando o usuário grava.
      const { default: Recorder } = await import("opus-recorder");
      const recorder = new Recorder({
        encoderPath: OPUS_ENCODER_PATH,
        numberOfChannels: 1,
        encoderApplication: 2048, // VOIP — otimizado para fala
        encoderSampleRate: 48000,
        streamPages: false, // um callback com o arquivo completo no stop
      });
      cancelledRef.current = false;
      recorder.ondataavailable = (bytes) => {
        if (cancelledRef.current) return;
        finalizeRecording(bytes);
      };
      recorderRef.current = recorder;
      await recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((seconds) => {
          const next = seconds + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            queueMicrotask(() => {
              clearTimer();
              setRecording(false);
              void recorderRef.current?.stop().catch(() => {});
            });
          }
          return next;
        });
      }, 1000);
    } catch {
      void recorderRef.current?.stop().catch(() => {});
      recorderRef.current = null;
      onError("Não foi possível acessar o microfone.");
    }
  }, [recording, uploading, finalizeRecording, onError, clearTimer]);

  const stopRecording = useCallback(() => {
    clearTimer();
    setRecording(false);
    void recorderRef.current?.stop().catch(() => {});
  }, [clearTimer]);

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true;
    clearTimer();
    setRecording(false);
    void recorderRef.current?.stop().catch(() => {});
  }, [clearTimer]);

  // ---- Render ---------------------------------------------------------

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: "8px 8px 0 0",
        bgcolor: "background.paper",
        flexShrink: 0,
      }}
    >
      {replyTo ? (
        <Box sx={{ mb: 1 }}>
          <ReplyQuote
            authorLabel={replyTo.authorLabel}
            preview={replyTo.preview}
            onDismiss={onClearReply}
          />
        </Box>
      ) : null}

      {/* Inputs de arquivo ocultos, acionados pelo menu do clipe. */}
      <input
        ref={imageInputRef}
        type="file"
        hidden
        accept={PICKER_ACCEPT.image}
        onChange={(event) => {
          handlePicked("image", event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        hidden
        accept={PICKER_ACCEPT.video}
        onChange={(event) => {
          handlePicked("video", event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <input
        ref={audioInputRef}
        type="file"
        hidden
        accept={PICKER_ACCEPT.audio}
        onChange={(event) => {
          handlePicked("audio", event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <input
        ref={documentInputRef}
        type="file"
        hidden
        accept={PICKER_ACCEPT.document}
        onChange={(event) => {
          handlePicked("document", event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      {draft ? (
        <Box
          sx={{
            borderRadius: "14px",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.default",
            p: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              {draft.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element -- preview local (Object URL)
                <img
                  src={draft.previewUrl}
                  alt={draft.file.name}
                  style={{
                    maxHeight: 160,
                    maxWidth: "100%",
                    borderRadius: 10,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : null}
              {draft.kind === "video" ? (
                <video
                  src={draft.previewUrl}
                  controls
                  style={{ maxHeight: 160, maxWidth: "100%", borderRadius: 10 }}
                />
              ) : null}
              {draft.kind === "audio" ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {draft.voiceNote ? (
                    <MicNoneOutlinedIcon
                      sx={{ fontSize: 20, color: "primary.main" }}
                    />
                  ) : null}
                  <audio
                    src={draft.previewUrl}
                    controls
                    style={{ width: "100%", maxWidth: 320 }}
                  />
                </Box>
              ) : null}
              {draft.kind === "document" ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <InsertDriveFileOutlinedIcon
                    sx={{ fontSize: 24, color: "text.secondary" }}
                  />
                  <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                    {draft.file.name}
                  </Typography>
                </Box>
              ) : null}
            </Box>
            <IconButton
              color="error"
              size="small"
              aria-label="Remover anexo"
              onClick={discardDraft}
              disabled={uploading}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {uploading ? (
            <LinearProgress
              variant={uploadProgress > 0 ? "determinate" : "indeterminate"}
              value={uploadProgress}
              sx={{ mt: 1.25, borderRadius: 999 }}
            />
          ) : null}

          <Box sx={{ mt: 1.25, display: "flex", alignItems: "center", gap: 1 }}>
            {draft.kind !== "audio" ? (
              <TextField
                size="small"
                fullWidth
                placeholder="Adicionar legenda..."
                value={draft.caption}
                disabled={uploading}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          caption: event.target.value.slice(0, MEDIA_CAPTION_MAX),
                        }
                      : current,
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSendDraft();
                  }
                }}
              />
            ) : (
              <Box sx={{ flex: 1 }} />
            )}
            <Button
              variant="contained"
              disabled={uploading}
              onClick={() => void handleSendDraft()}
              sx={{ minWidth: 44, width: 44, height: 40, borderRadius: "10px", p: 0 }}
              aria-label="Enviar anexo"
            >
              {uploading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <SendRoundedIcon fontSize="small" />
              )}
            </Button>
          </Box>
        </Box>
      ) : recording ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 1.25,
            borderRadius: "14px",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.default",
          }}
        >
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: "error.main",
              flexShrink: 0,
              animation: "conversas-rec-pulse 1.2s ease-in-out infinite",
              "@keyframes conversas-rec-pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.35 },
              },
            }}
          />
          <Typography variant="body2" sx={{ flex: 1 }}>
            Gravando... {formatDuration(recordSeconds)} /{" "}
            {formatDuration(MAX_RECORDING_SECONDS)}
          </Typography>
          <Button
            size="small"
            color="secondary"
            onClick={cancelRecording}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Cancelar
          </Button>
          <Tooltip title="Parar e anexar">
            <IconButton
              aria-label="Parar gravação e anexar"
              onClick={stopRecording}
              sx={{
                bgcolor: "primary.main",
                color: "primary.contrastText",
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              <StopRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: 1,
            p: 1,
            borderRadius: "14px",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.default",
          }}
        >
          <Tooltip title="Anexar">
            <IconButton
              size="small"
              aria-label="Anexar arquivo"
              onClick={(event) => setAttachAnchor(event.currentTarget)}
              sx={{ mb: 0.25 }}
            >
              <AttachFileOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={attachAnchor}
            open={Boolean(attachAnchor)}
            onClose={() => setAttachAnchor(null)}
          >
            <MenuItem
              onClick={() => {
                setAttachAnchor(null);
                imageInputRef.current?.click();
              }}
            >
              <ListItemIcon>
                <ImageOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Foto" />
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAttachAnchor(null);
                videoInputRef.current?.click();
              }}
            >
              <ListItemIcon>
                <VideocamOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Vídeo" />
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAttachAnchor(null);
                documentInputRef.current?.click();
              }}
            >
              <ListItemIcon>
                <DescriptionOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Documento" />
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAttachAnchor(null);
                audioInputRef.current?.click();
              }}
            >
              <ListItemIcon>
                <AudiotrackOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Áudio" />
            </MenuItem>
          </Menu>

          <TextField
            fullWidth
            multiline
            minRows={1}
            maxRows={5}
            placeholder="Escreva sua mensagem..."
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSendText();
              }
            }}
            variant="standard"
            slotProps={{
              input: {
                disableUnderline: true,
                sx: { fontSize: 14, py: 0.75 },
              },
            }}
          />

          <Tooltip title="Gravar nota de voz">
            <IconButton
              size="small"
              aria-label="Gravar nota de voz"
              onClick={() => void startRecording()}
              sx={{ mb: 0.25 }}
            >
              <MicNoneOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            color="primary"
            disabled={!text.trim()}
            onClick={handleSendText}
            sx={{ minWidth: 44, width: 44, height: 40, borderRadius: "10px", p: 0 }}
            aria-label="Enviar mensagem"
          >
            <SendRoundedIcon fontSize="small" />
          </Button>
        </Box>
      )}
    </Box>
  );
}

"use client";

import { useState } from "react";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BlockIcon from "@mui/icons-material/Block";
import CheckIcon from "@mui/icons-material/Check";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContactPageOutlinedIcon from "@mui/icons-material/ContactPageOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlined";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ReplyIcon from "@mui/icons-material/Reply";
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  buildMessagePreview,
  formatFileSize,
  formatMessageTime,
  formatPhoneDisplay,
  getInitials,
  isPdfMessage,
} from "./conversation-utils";
import LinkifiedText from "./linkified-text";
import type { ThreadFeedback } from "./conversation-thread";
import AudioPlayer from "./audio-player";
import MediaViewerModal, { type MediaViewerKind } from "./media-viewer-modal";
import MessageReactions from "./message-reactions";
import PdfThumbnail from "./pdf-thumbnail";
import ReplyQuote from "./reply-quote";
import {
  useCreateConversationMutation,
  useCreateCustomerFromConversationMutation,
} from "@/hooks/conversations/use-conversation-mutations";
import {
  downloadMessageAttachment,
  useMessageMediaUrl,
} from "@/hooks/conversations/use-message-actions";
import {
  isTempMessageId,
  localMediaPreviewUrls,
} from "@/hooks/conversations/use-send-message";
import type {
  ChatMessageContactCardEntry,
  ChatMessageDto,
  ChatMessageStatus,
} from "@/types/api/conversation";

type MessageBubbleProps = {
  message: ChatMessageDto;
  currentMembershipId: string | null;
  /** Clique numa pílula de reação (toggle). */
  onToggleReaction?: (emoji: string) => void;
  /** Clique na citação → rolar até a mensagem original. */
  onQuoteClick?: (messageId: string) => void;
  /** Highlight temporário (alvo de uma citação clicada). */
  highlighted?: boolean;
  /** Modo seleção múltipla (encaminhar). */
  selectionMode?: boolean;
  selected?: boolean;
  selectable?: boolean;
  onToggleSelect?: () => void;
  /** Feedback (Snackbar) do thread — usado pelo cartão de contato ao converter em lead. */
  onFeedback?: (feedback: ThreadFeedback) => void;
};

function StatusTicks({ status }: { status: ChatMessageStatus }) {
  switch (status) {
    case "sending":
      return <AccessTimeIcon sx={{ fontSize: 13, color: "text.disabled" }} />;
    case "sent":
      return <CheckIcon sx={{ fontSize: 14, color: "text.disabled" }} />;
    case "delivered":
      return <DoneAllIcon sx={{ fontSize: 14, color: "text.disabled" }} />;
    case "read":
      return <DoneAllIcon sx={{ fontSize: 14, color: "info.main" }} />;
    case "failed":
      return <CloseIcon sx={{ fontSize: 14, color: "error.main" }} />;
    default:
      return null;
  }
}

function MediaFallback({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 1,
        borderRadius: "10px",
        bgcolor:
          "color-mix(in srgb, var(--mui-palette-text-primary) 5%, transparent)",
        color: "text.secondary",
      }}
    >
      {icon}
      <Typography variant="caption">{label}</Typography>
    </Box>
  );
}

function MediaLoading({ height = 140, width = 220 }: { height?: number; width?: number }) {
  return (
    <Skeleton
      variant="rounded"
      width={width}
      height={height}
      sx={{ borderRadius: "10px" }}
    />
  );
}

function DocumentCard({
  message,
  fileName,
  sizeLabel,
}: {
  message: ChatMessageDto;
  fileName: string;
  sizeLabel: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const temp = isTempMessageId(message.id);

  const handleDownload = async () => {
    if (temp || downloading) return;
    setDownloading(true);
    try {
      await downloadMessageAttachment(message.id);
    } catch (error) {
      console.error("[conversas] download de documento", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        px: 1.5,
        py: 1.25,
        minWidth: 200,
        maxWidth: 280,
        borderRadius: "10px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor:
          "color-mix(in srgb, var(--mui-palette-text-primary) 4%, transparent)",
      }}
    >
      <InsertDriveFileOutlinedIcon
        sx={{ fontSize: 28, color: "text.secondary", flexShrink: 0 }}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {fileName}
        </Typography>
        {sizeLabel ? (
          <Typography variant="caption" color="text.secondary">
            {sizeLabel}
          </Typography>
        ) : null}
      </Box>
      <IconButton
        size="small"
        aria-label="Baixar documento"
        onClick={handleDownload}
        disabled={temp || downloading}
        sx={{ flexShrink: 0 }}
      >
        {downloading ? (
          <CircularProgress size={16} />
        ) : (
          <DownloadOutlinedIcon fontSize="small" />
        )}
      </IconButton>
    </Box>
  );
}

function MessageMediaContent({
  message,
  onOpenViewer,
}: {
  message: ChatMessageDto;
  onOpenViewer: (kind: MediaViewerKind, title?: string) => void;
}) {
  const temp = isTempMessageId(message.id);
  const localPreview = localMediaPreviewUrls.get(message.id) ?? null;
  const isPdf = isPdfMessage(message);
  const isSticker = message.contentType === "sticker";

  // URL assinada só quando precisamos renderizar inline e não há preview local.
  const needsRemoteUrl =
    !temp &&
    !localPreview &&
    (message.contentType === "image" ||
      message.contentType === "video" ||
      message.contentType === "audio" ||
      isSticker ||
      isPdf);

  const media = useMessageMediaUrl(needsRemoteUrl ? message.id : null);
  const url = localPreview ?? media.data?.downloadUrl ?? null;
  const loading = needsRemoteUrl && media.isLoading;
  const failed = needsRemoteUrl && media.isError;

  const fileName =
    message.media?.fileName || (isPdf ? "Documento.pdf" : "Documento");
  const sizeLabel = formatFileSize(message.media?.sizeBytes ?? null);

  switch (message.contentType) {
    case "image":
    case "sticker": {
      const dimension = isSticker ? 110 : undefined;
      if (loading || (temp && !localPreview)) {
        return <MediaLoading height={isSticker ? 110 : 160} width={isSticker ? 110 : 220} />;
      }
      if (failed || !url) {
        return (
          <MediaFallback
            icon={<ImageNotSupportedOutlinedIcon sx={{ fontSize: 18 }} />}
            label={isSticker ? "Figurinha indisponível" : "Imagem indisponível"}
          />
        );
      }
      return (
        <ButtonBase
          onClick={
            isSticker ? undefined : () => onOpenViewer("image", fileName)
          }
          disabled={isSticker}
          aria-label={isSticker ? "Figurinha" : "Ampliar imagem"}
          sx={{
            borderRadius: "10px",
            overflow: "hidden",
            display: "block",
            cursor: isSticker ? "default" : "zoom-in",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- URL assinada e efêmera */}
          <img
            src={url}
            alt={isSticker ? "Figurinha" : "Imagem enviada"}
            style={{
              display: "block",
              maxWidth: dimension ?? 260,
              maxHeight: dimension ?? 280,
              borderRadius: 10,
              objectFit: "cover",
            }}
          />
        </ButtonBase>
      );
    }

    case "video": {
      if (loading || (temp && !localPreview)) {
        return <MediaLoading height={160} width={240} />;
      }
      if (failed || !url) {
        return (
          <MediaFallback
            icon={<ImageNotSupportedOutlinedIcon sx={{ fontSize: 18 }} />}
            label="Vídeo indisponível"
          />
        );
      }
      return (
        <Box sx={{ position: "relative", maxWidth: 260 }}>
          <video
            src={url}
            controls
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: 280,
              borderRadius: 10,
              backgroundColor: "#000",
            }}
          />
        </Box>
      );
    }

    case "audio": {
      if (loading || temp) {
        return <MediaLoading height={44} width={240} />;
      }
      if (failed || !url) {
        return (
          <MediaFallback
            icon={<ImageNotSupportedOutlinedIcon sx={{ fontSize: 18 }} />}
            label="Áudio indisponível"
          />
        );
      }
      return (
        <AudioPlayer url={url} isVoiceNote={Boolean(message.media?.isVoiceNote)} />
      );
    }

    case "document": {
      if (isPdf) {
        if (temp) return <MediaLoading height={180} width={200} />;
        if (loading) return <MediaLoading height={180} width={200} />;
        if (failed || !url) {
          return (
            <DocumentCard
              message={message}
              fileName={fileName}
              sizeLabel={sizeLabel}
            />
          );
        }
        return (
          <PdfThumbnail
            url={url}
            title={fileName}
            onClick={() => onOpenViewer("pdf", fileName)}
          />
        );
      }
      return (
        <DocumentCard
          message={message}
          fileName={fileName}
          sizeLabel={sizeLabel}
        />
      );
    }

    default:
      return null;
  }
}

/** Um contato do cartão do WhatsApp — nome + telefone (quando o vCard trouxe) e botão de converter em lead. */
function ContactCardEntry({
  contact,
  onFeedback,
}: {
  contact: ChatMessageContactCardEntry;
  onFeedback?: (feedback: ThreadFeedback) => void;
}) {
  const createConversationMutation = useCreateConversationMutation();
  const createCustomerMutation = useCreateCustomerFromConversationMutation();
  const isPending =
    createConversationMutation.isPending || createCustomerMutation.isPending;
  const name = contact.name?.trim() || "Contato sem nome";

  const handleConvert = () => {
    if (!contact.phone || isPending) return;
    createConversationMutation.mutate(
      { phone: contact.phone, name: contact.name ?? undefined },
      {
        onSuccess: (conversation) => {
          createCustomerMutation.mutate(conversation.id, {
            onSuccess: () =>
              onFeedback?.({
                message: `Cliente "${name}" criado a partir do cartão de contato`,
                severity: "success",
              }),
            onError: (error) =>
              onFeedback?.({
                message:
                  error instanceof Error
                    ? error.message
                    : "Não foi possível criar o cliente",
                severity: "error",
              }),
          });
        },
        onError: (error) =>
          onFeedback?.({
            message:
              error instanceof Error
                ? error.message
                : "Não foi possível abrir a conversa deste contato",
            severity: "error",
          }),
      },
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        px: 1.5,
        py: 1.25,
        minWidth: 220,
        maxWidth: 280,
        borderRadius: "10px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor:
          "color-mix(in srgb, var(--mui-palette-text-primary) 4%, transparent)",
      }}
    >
      <Avatar sx={{ width: 36, height: 36, fontSize: 14, fontWeight: 700 }}>
        {getInitials(name)}
      </Avatar>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {name}
        </Typography>
        {contact.phone ? (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <PhoneOutlinedIcon sx={{ fontSize: 13, color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {formatPhoneDisplay(contact.phone)}
            </Typography>
          </Stack>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Telefone não informado
          </Typography>
        )}
        {contact.phone ? (
          <Button
            size="small"
            variant="text"
            startIcon={
              isPending ? (
                <CircularProgress size={13} />
              ) : (
                <PersonAddAltOutlinedIcon sx={{ fontSize: 15 }} />
              )
            }
            onClick={handleConvert}
            disabled={isPending}
            sx={{ mt: 0.25, px: 0.5, minWidth: 0, textTransform: "none" }}
          >
            {isPending ? "Convertendo..." : "Converter em lead"}
          </Button>
        ) : null}
      </Box>
    </Box>
  );
}

function ContactCardContent({
  contacts,
  fallbackLabel,
  onFeedback,
}: {
  contacts: ChatMessageContactCardEntry[];
  fallbackLabel: string;
  onFeedback?: (feedback: ThreadFeedback) => void;
}) {
  if (contacts.length === 0) {
    return (
      <MediaFallback
        icon={<ContactPageOutlinedIcon sx={{ fontSize: 18 }} />}
        label={fallbackLabel}
      />
    );
  }
  return (
    <Stack spacing={1}>
      {contacts.map((contact, index) => (
        <ContactCardEntry
          key={`${contact.phone ?? contact.name ?? "contato"}-${index}`}
          contact={contact}
          onFeedback={onFeedback}
        />
      ))}
    </Stack>
  );
}

function MessageContent({
  message,
  onOpenViewer,
  onFeedback,
}: {
  message: ChatMessageDto;
  onOpenViewer: (kind: MediaViewerKind, title?: string) => void;
  onFeedback?: (feedback: ThreadFeedback) => void;
}) {
  if (message.deletedAt) {
    return (
      <Typography
        variant="body2"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          fontStyle: "italic",
          color: "text.secondary",
        }}
      >
        <BlockIcon sx={{ fontSize: 15 }} />
        🚫 Mensagem apagada
      </Typography>
    );
  }

  switch (message.contentType) {
    case "text":
      return (
        <Typography
          variant="body2"
          sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", lineHeight: 1.5 }}
        >
          <LinkifiedText text={message.contentText ?? ""} />
        </Typography>
      );

    case "location":
      return (
        <MediaFallback
          icon={<PlaceOutlinedIcon sx={{ fontSize: 18 }} />}
          label={message.contentText || "Localização compartilhada"}
        />
      );

    case "contact_card":
      return (
        <ContactCardContent
          contacts={message.contactCard ?? []}
          fallbackLabel={message.contentText || "Cartão de contato"}
          onFeedback={onFeedback}
        />
      );

    case "unknown":
      return (
        <MediaFallback
          icon={<HelpOutlineIcon sx={{ fontSize: 18 }} />}
          label={message.contentText || "Mensagem não suportada"}
        />
      );

    default:
      return (
        <Box>
          <MessageMediaContent message={message} onOpenViewer={onOpenViewer} />
          {message.contentText && message.contentType !== "audio" ? (
            <Typography
              variant="body2"
              sx={{
                mt: 0.75,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                lineHeight: 1.5,
              }}
            >
              <LinkifiedText text={message.contentText} />
            </Typography>
          ) : null}
        </Box>
      );
  }
}

export default function MessageBubble({
  message,
  currentMembershipId,
  onToggleReaction,
  onQuoteClick,
  highlighted = false,
  selectionMode = false,
  selected = false,
  selectable = true,
  onToggleSelect,
  onFeedback,
}: MessageBubbleProps) {
  const isMine = message.direction === "outbound";
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerKind, setViewerKind] = useState<MediaViewerKind>("image");
  const [viewerTitle, setViewerTitle] = useState<string | undefined>(undefined);

  const openViewer = (kind: MediaViewerKind, title?: string) => {
    setViewerKind(kind);
    setViewerTitle(title);
    setViewerOpen(true);
  };

  const inSelection = selectionMode && selectable;
  const replyTo = message.replyTo;

  return (
    <>
      <Box
        data-message-id={message.id}
        onClick={inSelection ? onToggleSelect : undefined}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexDirection: isMine ? "row-reverse" : "row",
          cursor: inSelection ? "pointer" : "default",
          opacity: selectionMode && !selectable ? 0.5 : 1,
          borderRadius: "12px",
          transition: "background-color 300ms ease",
          bgcolor: highlighted
            ? "color-mix(in srgb, var(--mui-palette-primary-main) 14%, transparent)"
            : "transparent",
          px: highlighted ? 0.5 : 0,
        }}
      >
        {selectionMode ? (
          <Box aria-hidden sx={{ flexShrink: 0, display: "grid", placeItems: "center" }}>
            {selected ? (
              <CheckCircleIcon sx={{ fontSize: 20, color: "primary.main" }} />
            ) : (
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: "2px solid",
                  borderColor: selectable ? "text.disabled" : "divider",
                }}
              />
            )}
          </Box>
        ) : null}

        <Box
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: isMine ? "flex-end" : "flex-start",
            minWidth: 0,
          }}
        >
          {inSelection ? (
            <Box
              aria-hidden
              onClick={(event) => {
                event.stopPropagation();
                onToggleSelect?.();
              }}
              sx={{ position: "absolute", inset: 0, zIndex: 2, cursor: "pointer" }}
            />
          ) : null}

          <Box
            sx={{
              px: 1.5,
              py: 1,
              maxWidth: "100%",
              borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              bgcolor: isMine
                ? "color-mix(in srgb, var(--mui-palette-primary-main) 14%, var(--mui-palette-background-paper))"
                : "background.paper",
              border: "1px solid",
              borderColor: isMine
                ? "color-mix(in srgb, var(--mui-palette-primary-main) 26%, transparent)"
                : "divider",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              outline: selected ? "2px solid" : "none",
              outlineColor: "primary.main",
            }}
          >
            {message.forwarded && !message.deletedAt ? (
              <Typography
                variant="caption"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 0.4,
                  fontStyle: "italic",
                  color: "text.secondary",
                }}
              >
                <ReplyIcon sx={{ fontSize: 13, transform: "scaleX(-1)" }} />
                Encaminhada
              </Typography>
            ) : null}

            {!isMine && message.senderName && !message.deletedAt ? (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 0.35,
                  fontWeight: 700,
                  color: "primary.main",
                }}
              >
                {message.senderName}
              </Typography>
            ) : null}

            {replyTo && !message.deletedAt ? (
              <ReplyQuote
                authorLabel={
                  replyTo.senderType === "customer"
                    ? replyTo.senderName || "Contato"
                    : replyTo.senderName || "Você"
                }
                preview={buildMessagePreview(replyTo)}
                onClick={onQuoteClick ? () => onQuoteClick(replyTo.id) : undefined}
              />
            ) : null}

            <MessageContent
              message={message}
              onOpenViewer={openViewer}
              onFeedback={onFeedback}
            />

            <Box
              sx={{
                mt: 0.4,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 0.5,
              }}
            >
              <Typography variant="caption" sx={{ fontSize: 10.5, color: "text.disabled" }}>
                {formatMessageTime(message.createdAt)}
              </Typography>
              {message.editedAt && !message.deletedAt ? (
                <Typography variant="caption" sx={{ fontSize: 10.5, color: "text.disabled" }}>
                  (editada)
                </Typography>
              ) : null}
              {isMine && !message.deletedAt ? (
                <StatusTicks status={message.status} />
              ) : null}
            </Box>

            {isMine && message.status === "failed" && message.errorMessage ? (
              <Typography
                variant="caption"
                sx={{ display: "block", mt: 0.25, color: "error.main" }}
              >
                {message.errorMessage}
              </Typography>
            ) : null}
          </Box>

          {message.reactions.length > 0 && !message.deletedAt ? (
            <MessageReactions
              reactions={message.reactions}
              currentMembershipId={currentMembershipId}
              onToggle={onToggleReaction}
            />
          ) : null}
        </Box>
      </Box>

      {message.media ? (
        <MediaViewerModal
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          kind={viewerKind}
          messageId={message.id}
          title={viewerTitle ?? message.media.fileName ?? undefined}
        />
      ) : null}
    </>
  );
}

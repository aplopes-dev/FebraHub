"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import ShortcutIcon from "@mui/icons-material/Shortcut";
import UnfoldLessOutlinedIcon from "@mui/icons-material/UnfoldLessOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { chatDoodleSx } from "./chat-doodle";
import {
  buildMessagePreview,
  conversationDisplayName,
  formatPhoneDisplay,
  getInitials,
  groupMessagesByDay,
  isForwardableMessage,
  thinScrollSx,
} from "./conversation-utils";
import EditMessageDialog from "./edit-message-dialog";
import ForwardPicker, { FORWARD_MAX_TARGETS } from "./forward-picker";
import MessageActions from "./message-actions";
import MessageBubble from "./message-bubble";
import MessageComposer, {
  type ComposerSendMediaPayload,
  type ReplyDraft,
} from "./message-composer";
import { useAuth } from "@/components/auth/auth-context";
import { useCanPermission } from "@/hooks/permissions/use-ability";
import {
  flattenConversationMessages,
  useConversationMessagesQuery,
} from "@/hooks/conversations/use-conversation-messages";
import {
  useDeleteMessageMutation,
  useEditMessageMutation,
  useForwardMessagesMutation,
  useReactToMessageMutation,
} from "@/hooks/conversations/use-message-actions";
import { useUpdateConversationStatusMutation, useClearConversationMutation } from "@/hooks/conversations/use-conversation-mutations";
import {
  isTempMessageId,
  useSendMessageMutation,
} from "@/hooks/conversations/use-send-message";
import type {
  ChatMessageDto,
  ConversationDto,
  ConversationStatus,
} from "@/types/api/conversation";
import { CONVERSATION_STATUS_LABELS } from "@/types/api/conversation";

/** Máximo de mensagens por encaminhamento (espelha a API). */
const FORWARD_MAX_MESSAGES = 30;

export type ThreadFeedback = {
  message: string;
  severity: "success" | "info" | "warning" | "error";
};

type ConversationThreadProps = {
  conversation: ConversationDto | null;
  realtimeConnected: boolean;
  showBackButton?: boolean;
  showContextButton?: boolean;
  /** Mostra o botão de recolher esta coluna para uma tira fina (desktop). */
  showCollapseButton?: boolean;
  onBack?: () => void;
  onOpenContext?: () => void;
  onOpenAssign: () => void;
  onCollapse?: () => void;
  onCleared?: () => void;
  onFeedback: (feedback: ThreadFeedback) => void;
};

const STATUS_CHIP_COLORS: Record<ConversationStatus, "success" | "warning" | "default"> = {
  open: "success",
  pending: "warning",
  closed: "default",
};

export default function ConversationThread({
  conversation,
  realtimeConnected,
  showBackButton = false,
  showContextButton = false,
  showCollapseButton = false,
  onBack,
  onOpenContext,
  onOpenAssign,
  onCollapse,
  onCleared,
  onFeedback,
}: ConversationThreadProps) {
  const { membership } = useAuth();
  const canReply = useCanPermission("conversations.reply");
  const canAssign = useCanPermission("conversations.assign");
  const membershipId = membership?.id ?? null;

  const conversationId = conversation?.id ?? "";

  const messagesQuery = useConversationMessagesQuery(
    conversation ? conversation.id : null,
    { refetchInterval: conversation && !realtimeConnected ? 3000 : false },
  );
  const messages = useMemo(
    () => flattenConversationMessages(messagesQuery.data),
    [messagesQuery.data],
  );
  const groups = useMemo(() => groupMessagesByDay(messages), [messages]);

  const sendMutation = useSendMessageMutation(conversationId);
  const reactMutation = useReactToMessageMutation(conversationId);
  const editMutation = useEditMessageMutation(conversationId);
  const deleteMutation = useDeleteMessageMutation(conversationId);
  const forwardMutation = useForwardMessagesMutation();
  const statusMutation = useUpdateConversationStatusMutation();
  const clearMutation = useClearConversationMutation();

  // ---- Estado de UI ---------------------------------------------------
  const [replyTo, setReplyTo] = useState<ReplyDraft | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessageDto | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [forwardPickerOpen, setForwardPickerOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [statusAnchor, setStatusAnchor] = useState<HTMLElement | null>(null);
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, []);

  // Limpa rascunhos/seleção ao trocar de conversa.
  const lastConversationIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastConversationIdRef.current === conversationId) return;
    lastConversationIdRef.current = conversationId;
    // Reset síncrono seria flagged pelo lint; agenda para o próximo tick.
    const timer = setTimeout(() => {
      setReplyTo(null);
      setSelectionMode(false);
      setSelectedIds(new Set());
      setForwardPickerOpen(false);
      setHighlightedId(null);
      setEditingMessage(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [conversationId]);

  // ---- Scroll ---------------------------------------------------------
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const nearBottomRef = useRef(true);
  const forceScrollRef = useRef(false);
  const prependRef = useRef<{ height: number; top: number } | null>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const scrolledConversationRef = useRef<string | null>(null);

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const distance =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    nearBottomRef.current = distance < 140;

    // Carregamento automático de mensagens anteriores ao encostar no topo.
    if (
      element.scrollTop < 60 &&
      messagesQuery.hasNextPage &&
      !messagesQuery.isFetchingNextPage
    ) {
      prependRef.current = {
        height: element.scrollHeight,
        top: element.scrollTop,
      };
      void messagesQuery.fetchNextPage();
    }
  }, [messagesQuery]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || messages.length === 0) return;

    // Restaura a posição após paginar para trás (mensagens antigas em cima).
    if (prependRef.current) {
      const { height, top } = prependRef.current;
      prependRef.current = null;
      element.scrollTop = element.scrollHeight - height + top;
      return;
    }

    const lastId = messages[messages.length - 1]?.id ?? null;
    const conversationChanged =
      scrolledConversationRef.current !== conversationId;
    const hasNewLastMessage = lastMessageIdRef.current !== lastId;
    lastMessageIdRef.current = lastId;

    if (conversationChanged) {
      scrolledConversationRef.current = conversationId;
      element.scrollTop = element.scrollHeight;
      nearBottomRef.current = true;
      return;
    }

    if (hasNewLastMessage && (nearBottomRef.current || forceScrollRef.current)) {
      forceScrollRef.current = false;
      element.scrollTop = element.scrollHeight;
    }
  }, [messages, conversationId]);

  const scrollToMessage = useCallback((messageId: string) => {
    const container = scrollRef.current;
    if (!container) return;
    const target = container.querySelector<HTMLElement>(
      `[data-message-id="${CSS.escape(messageId)}"]`,
    );
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedId(messageId);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => setHighlightedId(null), 2000);
  }, []);

  // ---- Ações ----------------------------------------------------------

  const contactName = conversation ? conversationDisplayName(conversation) : "";

  const authorLabelFor = useCallback(
    (message: { direction: string; senderName: string | null }): string => {
      if (message.direction === "outbound") {
        return message.senderName || "Você";
      }
      return message.senderName || contactName || "Contato";
    },
    [contactName],
  );

  const handleStartReply = useCallback(
    (message: ChatMessageDto) => {
      setReplyTo({
        id: message.id,
        authorLabel: authorLabelFor(message),
        preview: buildMessagePreview({
          contentType: message.contentType,
          contentText: message.contentText,
          isVoiceNote: message.media?.isVoiceNote,
        }),
      });
    },
    [authorLabelFor],
  );

  const handleToggleReaction = useCallback(
    (message: ChatMessageDto, emoji: string) => {
      if (!canReply || isTempMessageId(message.id)) return;
      const mine = message.reactions.find(
        (reaction) => reaction.actorMembershipId === membershipId,
      );
      reactMutation.mutate(
        {
          messageId: message.id,
          emoji: mine?.emoji === emoji ? null : emoji,
        },
        {
          onError: () =>
            onFeedback({
              message: "Não foi possível reagir à mensagem.",
              severity: "error",
            }),
        },
      );
    },
    [canReply, membershipId, reactMutation, onFeedback],
  );

  const handleCopy = useCallback(
    async (message: ChatMessageDto) => {
      const value = message.contentText ?? "";
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        onFeedback({ message: "Texto copiado", severity: "success" });
      } catch {
        onFeedback({
          message: "Não foi possível copiar o texto.",
          severity: "error",
        });
      }
    },
    [onFeedback],
  );

  const handleStartForward = useCallback((message: ChatMessageDto) => {
    setReplyTo(null);
    setSelectionMode(true);
    setSelectedIds(new Set([message.id]));
  }, []);

  const toggleSelect = useCallback((messageId: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else if (next.size < FORWARD_MAX_MESSAGES) {
        next.add(messageId);
      }
      return next;
    });
  }, []);

  const exitSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setForwardPickerOpen(false);
  }, []);

  const handleConfirmForward = useCallback(
    async (targetConversationIds: string[]) => {
      const sourceMessageIds = [...selectedIds];
      if (sourceMessageIds.length === 0 || targetConversationIds.length === 0) {
        return;
      }
      try {
        const result = await forwardMutation.mutateAsync({
          sourceMessageIds,
          targetConversationIds: targetConversationIds.slice(
            0,
            FORWARD_MAX_TARGETS,
          ),
        });
        const totalSent = result.results.reduce(
          (sum, item) => sum + (item.sent ?? 0),
          0,
        );
        const totalFailed = result.results.reduce(
          (sum, item) => sum + (item.failed ?? 0),
          0,
        );
        if (totalFailed === 0) {
          onFeedback({
            message: `${totalSent} ${totalSent === 1 ? "mensagem encaminhada" : "mensagens encaminhadas"}`,
            severity: "success",
          });
        } else if (totalSent > 0) {
          onFeedback({
            message: `${totalSent} enviadas, ${totalFailed} falharam`,
            severity: "info",
          });
        } else {
          onFeedback({
            message: "Não foi possível encaminhar as mensagens.",
            severity: "error",
          });
        }
      } catch {
        onFeedback({
          message: "Não foi possível encaminhar as mensagens.",
          severity: "error",
        });
      } finally {
        exitSelection();
      }
    },
    [selectedIds, forwardMutation, onFeedback, exitSelection],
  );

  const handleEditSave = useCallback(
    async (message: ChatMessageDto, contentText: string) => {
      try {
        await editMutation.mutateAsync({ messageId: message.id, contentText });
        onFeedback({ message: "Mensagem editada", severity: "success" });
      } catch (error) {
        onFeedback({
          message: "Não foi possível editar a mensagem.",
          severity: "error",
        });
        throw error;
      }
    },
    [editMutation, onFeedback],
  );

  const handleDelete = useCallback(
    async (message: ChatMessageDto) => {
      try {
        await deleteMutation.mutateAsync({ messageId: message.id });
        onFeedback({ message: "Mensagem apagada", severity: "success" });
      } catch {
        onFeedback({
          message: "Não foi possível apagar a mensagem.",
          severity: "error",
        });
      }
    },
    [deleteMutation, onFeedback],
  );

  const handleSendText = useCallback(
    (contentText: string, replyToMessageId?: string) => {
      forceScrollRef.current = true;
      sendMutation.mutate({
        input: { type: "text", contentText, replyToMessageId },
      });
    },
    [sendMutation],
  );

  const handleSendMedia = useCallback(
    (payload: ComposerSendMediaPayload) => {
      forceScrollRef.current = true;
      sendMutation.mutate({
        input: {
          type: "media",
          media: payload.descriptor,
          contentText: payload.caption,
          replyToMessageId: payload.replyToMessageId,
        },
        localPreviewUrl: payload.localPreviewUrl,
      });
    },
    [sendMutation],
  );

  const handleStatusChange = useCallback(
    (status: ConversationStatus) => {
      if (!conversation) return;
      statusMutation.mutate(
        { conversationId: conversation.id, status },
        {
          onSuccess: () =>
            onFeedback({
              message: `Conversa marcada como ${CONVERSATION_STATUS_LABELS[status].toLowerCase()}`,
              severity: "success",
            }),
          onError: () =>
            onFeedback({
              message: "Não foi possível atualizar o status.",
              severity: "error",
            }),
        },
      );
    },
    [conversation, statusMutation, onFeedback],
  );

  // ---- Render ---------------------------------------------------------

  if (!conversation) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "grid",
          placeItems: "center",
          px: 3,
          ...chatDoodleSx,
        }}
      >
        <Box
          sx={{
            textAlign: "center",
            maxWidth: 360,
            px: 2.5,
            py: 2,
            borderRadius: "12px",
            bgcolor:
              "color-mix(in srgb, var(--mui-palette-background-paper) 88%, transparent)",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.75 }}>
            Selecione uma conversa
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Escolha uma conversa à esquerda para ver as mensagens e responder.
          </Typography>
        </Box>
      </Box>
    );
  }

  const phoneLabel = formatPhoneDisplay(conversation.contactPhone);
  const isGroup = conversation.chatType === "group";
  const subtitle = isGroup
    ? "Grupo no WhatsApp"
    : `${phoneLabel}${conversation.customerName ? ` · ${conversation.customerName}` : ""}`;

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        bgcolor: "transparent",
      }}
    >
      {/* Cabeçalho */}
      <Stack
        direction="row"
        spacing={1.25}
        sx={{
          alignItems: "center",
          px: 2,
          py: 1.35,
          bgcolor: "background.paper",
          flexShrink: 0,
          minHeight: 68,
          borderRadius: "8px",
        }}
      >
        {showBackButton ? (
          <IconButton aria-label="Voltar para lista" onClick={onBack}>
            <ArrowBackIcon />
          </IconButton>
        ) : null}

        <Avatar
          src={conversation.avatarUrl ?? undefined}
          sx={{
            width: 40,
            height: 40,
            bgcolor: "primary.main",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {getInitials(contactName)}
        </Avatar>

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 750 }}>
              {contactName}
            </Typography>
            {isGroup ? (
              <Chip
                size="small"
                label="Grupo"
                variant="outlined"
                sx={{ height: 22, fontWeight: 700, flexShrink: 0 }}
              />
            ) : (
              <WhatsAppIcon sx={{ fontSize: 16, color: "#25D366", flexShrink: 0 }} />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary" noWrap>
            {subtitle}
          </Typography>
        </Box>

        <Chip
          size="small"
          color={STATUS_CHIP_COLORS[conversation.status]}
          variant={conversation.status === "closed" ? "outlined" : "filled"}
          label={CONVERSATION_STATUS_LABELS[conversation.status]}
          deleteIcon={<ExpandMoreRoundedIcon />}
          onDelete={(event: React.SyntheticEvent) =>
            setStatusAnchor(event.currentTarget as HTMLElement)
          }
          onClick={(event) => setStatusAnchor(event.currentTarget)}
          sx={{ fontWeight: 600 }}
        />
        <Menu
          anchorEl={statusAnchor}
          open={Boolean(statusAnchor)}
          onClose={() => setStatusAnchor(null)}
        >
          {(Object.keys(CONVERSATION_STATUS_LABELS) as ConversationStatus[]).map(
            (status) => (
              <MenuItem
                key={status}
                selected={status === conversation.status}
                onClick={() => {
                  setStatusAnchor(null);
                  if (status !== conversation.status) handleStatusChange(status);
                }}
              >
                {CONVERSATION_STATUS_LABELS[status]}
              </MenuItem>
            ),
          )}
        </Menu>

        {canAssign ? (
          <Tooltip title="Atribuir conversa">
            <IconButton aria-label="Atribuir conversa" onClick={onOpenAssign}>
              <PersonAddAltOutlinedIcon />
            </IconButton>
          </Tooltip>
        ) : null}
        {showContextButton ? (
          <Tooltip title="Contexto do contato">
            <IconButton aria-label="Abrir contexto" onClick={onOpenContext}>
              <InfoOutlinedIcon />
            </IconButton>
          </Tooltip>
        ) : null}
        {showCollapseButton ? (
          <Tooltip title="Recolher mensagens">
            <IconButton aria-label="Recolher mensagens" onClick={onCollapse}>
              <UnfoldLessOutlinedIcon
                sx={{ transform: "rotate(90deg)" }}
              />
            </IconButton>
          </Tooltip>
        ) : null}
        <IconButton
          aria-label="Mais ações"
          onClick={(event) => setMoreAnchor(event.currentTarget)}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          anchorEl={moreAnchor}
          open={Boolean(moreAnchor)}
          onClose={() => setMoreAnchor(null)}
        >
          {conversation.status !== "closed" ? (
            <MenuItem
              onClick={() => {
                setMoreAnchor(null);
                handleStatusChange("closed");
              }}
            >
              <CheckCircleOutlineIcon fontSize="small" sx={{ mr: 1 }} />
              Fechar conversa
            </MenuItem>
          ) : (
            <MenuItem
              onClick={() => {
                setMoreAnchor(null);
                handleStatusChange("open");
              }}
            >
              Reabrir conversa
            </MenuItem>
          )}
          {canAssign ? (
            <MenuItem
              onClick={() => {
                setMoreAnchor(null);
                onOpenAssign();
              }}
            >
              <PersonAddAltOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
              Atribuir a colega
            </MenuItem>
          ) : null}
          {canReply ? (
            <MenuItem
              onClick={() => {
                setMoreAnchor(null);
                setClearConfirmOpen(true);
              }}
              sx={{ color: "error.main" }}
            >
              <DeleteOutlineOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
              Limpar conversa
            </MenuItem>
          ) : null}
        </Menu>
      </Stack>

      <Dialog
        open={clearConfirmOpen}
        onClose={() =>
          clearMutation.isPending ? undefined : setClearConfirmOpen(false)
        }
      >
        <DialogTitle>Limpar conversa?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Remove o histórico desta conversa do CRM. O chat no WhatsApp não é
            alterado. Novas mensagens podem reabrir a conversa aqui.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            color="secondary"
            disabled={clearMutation.isPending}
            onClick={() => setClearConfirmOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={!conversation || clearMutation.isPending}
            onClick={() => {
              if (!conversation) return;
              clearMutation.mutate(conversation.id, {
                onSuccess: () => {
                  setClearConfirmOpen(false);
                  onFeedback({
                    message: "Conversa limpa do CRM.",
                    severity: "success",
                  });
                  onCleared?.();
                },
                onError: () => {
                  onFeedback({
                    message: "Não foi possível limpar a conversa.",
                    severity: "error",
                  });
                },
              });
            }}
          >
            {clearMutation.isPending ? "Limpando…" : "Limpar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mensagens */}
      <Box
        ref={scrollRef}
        onScroll={handleScroll}
        sx={{
          ...thinScrollSx,
          ...chatDoodleSx,
          flex: 1,
          minHeight: 0,
          px: 2.5,
          py: 2.5,
        }}
      >
        {messagesQuery.isLoading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress size={24} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                px: 2,
                py: 1,
                borderRadius: "10px",
                bgcolor:
                  "color-mix(in srgb, var(--mui-palette-background-paper) 88%, transparent)",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              Nenhuma mensagem ainda. Envie a primeira!
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {messagesQuery.hasNextPage ? (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Button
                  size="small"
                  color="secondary"
                  disabled={messagesQuery.isFetchingNextPage}
                  onClick={() => {
                    const element = scrollRef.current;
                    if (element) {
                      prependRef.current = {
                        height: element.scrollHeight,
                        top: element.scrollTop,
                      };
                    }
                    void messagesQuery.fetchNextPage();
                  }}
                  startIcon={
                    messagesQuery.isFetchingNextPage ? (
                      <CircularProgress size={14} />
                    ) : null
                  }
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 999,
                    px: 2,
                  }}
                >
                  Carregar mensagens anteriores
                </Button>
              </Box>
            ) : null}

            {groups.map((group) => (
              <Box key={group.key}>
                <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                  <Box
                    sx={{
                      px: 1.25,
                      py: 0.4,
                      borderRadius: 999,
                      bgcolor: "background.paper",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 600 }}
                    >
                      {group.label}
                    </Typography>
                  </Box>
                </Box>

                <Stack spacing={1}>
                  {group.items.map((message) => {
                    const isMineMessage =
                      message.direction === "outbound" &&
                      message.senderMembershipId != null &&
                      message.senderMembershipId === membershipId;
                    const actionable =
                      !isTempMessageId(message.id) &&
                      message.status !== "sending" &&
                      !message.deletedAt;
                    const canEditThis =
                      isMineMessage &&
                      actionable &&
                      message.status !== "failed" &&
                      message.contentType === "text";
                    const canDeleteThis =
                      isMineMessage && actionable && message.status !== "failed";
                    const forwardable = isForwardableMessage(message);

                    return (
                      <MessageActions
                        key={message.id}
                        message={message}
                        canWrite={canReply && actionable}
                        canEdit={canEditThis}
                        canDelete={canDeleteThis}
                        canForward={forwardable}
                        selectionMode={selectionMode}
                        onReply={() => handleStartReply(message)}
                        onReact={(emoji) => handleToggleReaction(message, emoji)}
                        onCopy={() => void handleCopy(message)}
                        onForward={() => handleStartForward(message)}
                        onEdit={() => setEditingMessage(message)}
                        onDelete={() => handleDelete(message)}
                      >
                        <MessageBubble
                          message={message}
                          currentMembershipId={membershipId}
                          onToggleReaction={
                            canReply
                              ? (emoji) => handleToggleReaction(message, emoji)
                              : undefined
                          }
                          onQuoteClick={scrollToMessage}
                          highlighted={highlightedId === message.id}
                          selectionMode={selectionMode}
                          selected={selectedIds.has(message.id)}
                          selectable={forwardable}
                          onToggleSelect={() => toggleSelect(message.id)}
                          onFeedback={onFeedback}
                        />
                      </MessageActions>
                    );
                  })}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Barra de seleção (encaminhar) ou composer */}
      {selectionMode ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2,
            py: 1.5,
            borderRadius: "8px 8px 0 0",
            bgcolor: "background.paper",
            flexShrink: 0,
          }}
        >
          <Button
            size="small"
            color="secondary"
            startIcon={<CloseIcon fontSize="small" />}
            onClick={exitSelection}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Cancelar
          </Button>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ flex: 1, textAlign: "center" }}
          >
            {selectedIds.size} de {FORWARD_MAX_MESSAGES} selecionadas
          </Typography>
          <Button
            variant="contained"
            size="small"
            disabled={selectedIds.size === 0}
            startIcon={<ShortcutIcon fontSize="small" />}
            onClick={() => setForwardPickerOpen(true)}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Encaminhar
          </Button>
        </Box>
      ) : canReply ? (
        <MessageComposer
          conversationId={conversation.id}
          replyTo={replyTo}
          onClearReply={() => setReplyTo(null)}
          onSendText={handleSendText}
          onSendMedia={handleSendMedia}
          onError={(message) => onFeedback({ message, severity: "error" })}
        />
      ) : (
        <Box
          sx={{
            px: 2,
            py: 1.75,
            borderRadius: "8px 8px 0 0",
            bgcolor: "background.paper",
            flexShrink: 0,
          }}
        >
          <Typography variant="body2" color="text.secondary" align="center">
            Você não tem permissão para responder conversas.
          </Typography>
        </Box>
      )}

      <EditMessageDialog
        message={editingMessage}
        onClose={() => setEditingMessage(null)}
        onSave={handleEditSave}
      />

      <ForwardPicker
        open={forwardPickerOpen}
        onClose={() => setForwardPickerOpen(false)}
        messageCount={selectedIds.size}
        onConfirm={handleConfirmForward}
      />
    </Box>
  );
}

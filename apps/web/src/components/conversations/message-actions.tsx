"use client";

import { useState, type ReactNode } from "react";
import AddReactionOutlinedIcon from "@mui/icons-material/AddReactionOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ReplyIcon from "@mui/icons-material/Reply";
import ShortcutIcon from "@mui/icons-material/Shortcut";
import {
  Box,
  Button,
  Dialog,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
} from "@mui/material";
import {
  ConversasDialogActions,
  ConversasDialogContent,
  ConversasDialogHeader,
  conversasDialogPaperSx,
} from "@/components/common/dialog-form-ui";
import { Typography } from "@mui/material";
import type { ChatMessageDto } from "@/types/api/conversation";

/** Mesmo conjunto da barra de reação rápida do WhatsApp. */
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

type MessageActionsProps = {
  message: ChatMessageDto;
  /** Permissão de escrita (conversations.reply) — sem ela só sobra Copiar. */
  canWrite: boolean;
  /** Mensagem minha de texto → pode editar. */
  canEdit: boolean;
  /** Mensagem minha → pode apagar para todos. */
  canDelete: boolean;
  canForward: boolean;
  selectionMode: boolean;
  onReply: () => void;
  onReact: (emoji: string) => void;
  onCopy: () => void;
  onForward: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void> | void;
  children: ReactNode;
};

/**
 * Wrapper de ações por mensagem: toolbar flutuante no hover da bolha
 * (reagir/responder/menu ⋮) + popover de reação rápida + confirmação de
 * exclusão. A bolha em si continua um apresentador puro.
 */
export default function MessageActions({
  message,
  canWrite,
  canEdit,
  canDelete,
  canForward,
  selectionMode,
  onReply,
  onReact,
  onCopy,
  onForward,
  onEdit,
  onDelete,
  children,
}: MessageActionsProps) {
  const [emojiAnchor, setEmojiAnchor] = useState<HTMLElement | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isMine = message.direction === "outbound";
  const deleted = Boolean(message.deletedAt);
  const hasText = Boolean(message.contentText);

  const showToolbar = !selectionMode && !deleted;

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
      setConfirmDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        justifyContent: isMine ? "flex-end" : "flex-start",
      }}
    >
      <Box
        sx={{
          position: "relative",
          minWidth: 0,
          maxWidth: { xs: "86%", md: "72%" },
          "&:hover .msg-toolbar, &:focus-within .msg-toolbar": {
            opacity: 1,
            pointerEvents: "auto",
          },
        }}
      >
        {children}

        {showToolbar ? (
          <Box
            className="msg-toolbar"
            sx={{
              position: "absolute",
              top: -14,
              ...(isMine ? { right: 8 } : { left: 8 }),
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              gap: 0.25,
              px: 0.5,
              py: 0.25,
              borderRadius: 999,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              opacity: emojiAnchor || menuAnchor ? 1 : 0,
              pointerEvents: emojiAnchor || menuAnchor ? "auto" : "none",
              transition: "opacity 120ms ease",
            }}
          >
            {canWrite ? (
              <IconButton
                size="small"
                aria-label="Reagir"
                onClick={(event) => setEmojiAnchor(event.currentTarget)}
                sx={{ width: 26, height: 26 }}
              >
                <AddReactionOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            ) : null}
            {canWrite ? (
              <IconButton
                size="small"
                aria-label="Responder"
                onClick={onReply}
                sx={{ width: 26, height: 26 }}
              >
                <ReplyIcon sx={{ fontSize: 16 }} />
              </IconButton>
            ) : null}
            <IconButton
              size="small"
              aria-label="Mais ações da mensagem"
              onClick={(event) => setMenuAnchor(event.currentTarget)}
              sx={{ width: 26, height: 26 }}
            >
              <MoreVertIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        ) : null}
      </Box>

      <Popover
        open={Boolean(emojiAnchor)}
        anchorEl={emojiAnchor}
        onClose={() => setEmojiAnchor(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        slotProps={{ paper: { sx: { borderRadius: 999, px: 0.75, py: 0.25 } } }}
      >
        <Box sx={{ display: "flex", gap: 0.25 }}>
          {QUICK_EMOJIS.map((emoji) => (
            <IconButton
              key={emoji}
              aria-label={`Reagir com ${emoji}`}
              onClick={() => {
                onReact(emoji);
                setEmojiAnchor(null);
              }}
              sx={{
                fontSize: 20,
                width: 38,
                height: 38,
                transition: "transform 120ms ease",
                "&:hover": { transform: "scale(1.2)" },
              }}
            >
              {emoji}
            </IconButton>
          ))}
        </Box>
      </Popover>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        {canWrite ? (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onReply();
            }}
          >
            <ListItemIcon>
              <ReplyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Responder" />
          </MenuItem>
        ) : null}
        {hasText ? (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onCopy();
            }}
          >
            <ListItemIcon>
              <ContentCopyOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Copiar texto" />
          </MenuItem>
        ) : null}
        {canWrite && canForward ? (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onForward();
            }}
          >
            <ListItemIcon>
              <ShortcutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Encaminhar" />
          </MenuItem>
        ) : null}
        {canWrite && canEdit ? (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              onEdit();
            }}
          >
            <ListItemIcon>
              <EditOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Editar" />
          </MenuItem>
        ) : null}
        {canWrite && canDelete ? (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              setConfirmDeleteOpen(true);
            }}
            sx={{ color: "error.main" }}
          >
            <ListItemIcon>
              <DeleteOutlineIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText primary="Apagar" />
          </MenuItem>
        ) : null}
      </Menu>

      <Dialog
        open={confirmDeleteOpen}
        onClose={deleting ? undefined : () => setConfirmDeleteOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: conversasDialogPaperSx } }}
      >
        <ConversasDialogHeader
          icon={<DeleteOutlineIcon />}
          title="Apagar mensagem"
          description="A mensagem será apagada para todos nesta conversa."
          tone="warning"
        />
        <ConversasDialogContent>
          <Typography variant="body2" color="text.secondary">
            Essa ação não pode ser desfeita.
          </Typography>
        </ConversasDialogContent>
        <ConversasDialogActions>
          <Button
            color="secondary"
            disabled={deleting}
            onClick={() => setConfirmDeleteOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleting}
            onClick={handleConfirmDelete}
          >
            {deleting ? "Apagando..." : "Apagar para todos"}
          </Button>
        </ConversasDialogActions>
      </Dialog>
    </Box>
  );
}

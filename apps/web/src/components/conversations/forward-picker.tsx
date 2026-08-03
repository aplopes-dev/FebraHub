"use client";

import { useMemo, useState } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";
import ShortcutIcon from "@mui/icons-material/Shortcut";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  InputAdornment,
  ListItemButton,
  TextField,
  Typography,
} from "@mui/material";
import {
  ConversasDialogActions,
  ConversasDialogContent,
  ConversasDialogHeader,
  conversasDialogPaperSx,
  conversasFieldSx,
} from "@/components/common/dialog-form-ui";
import {
  conversationDisplayName,
  formatPhoneDisplay,
  getInitials,
} from "./conversation-utils";
import { useConversationsQuery } from "@/hooks/conversations/use-conversations";

/** Máximo de conversas de destino por encaminhamento (espelha a API). */
export const FORWARD_MAX_TARGETS = 30;

type ForwardPickerProps = {
  open: boolean;
  onClose: () => void;
  /** Quantas mensagens serão encaminhadas — exibido no cabeçalho. */
  messageCount: number;
  /** Confirmação com os ids das conversas de destino. Pode retornar Promise —
   *  o diálogo fica em loading até resolver. */
  onConfirm: (targetConversationIds: string[]) => void | Promise<void>;
};

export default function ForwardPicker({
  open,
  onClose,
  messageCount,
  onConfirm,
}: ForwardPickerProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [forwarding, setForwarding] = useState(false);

  const conversationsQuery = useConversationsQuery({}, { enabled: open });
  const conversations = useMemo(
    () => conversationsQuery.data ?? [],
    [conversationsQuery.data],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => {
      const name = conversationDisplayName(conversation).toLowerCase();
      const phone = conversation.contactPhone.toLowerCase();
      return name.includes(query) || phone.includes(query);
    });
  }, [conversations, search]);

  const handleClose = () => {
    if (forwarding) return;
    setSearch("");
    setSelected(new Set());
    onClose();
  };

  const toggle = (id: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < FORWARD_MAX_TARGETS) {
        next.add(id);
      }
      return next;
    });
  };

  const confirm = async () => {
    if (selected.size === 0 || forwarding) return;
    setForwarding(true);
    try {
      await onConfirm([...selected]);
      setSearch("");
      setSelected(new Set());
    } finally {
      setForwarding(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: conversasDialogPaperSx } }}
    >
      <ConversasDialogHeader
        icon={<ShortcutIcon />}
        title="Encaminhar mensagens"
        description={`${messageCount} ${messageCount === 1 ? "mensagem" : "mensagens"} · escolha até ${FORWARD_MAX_TARGETS} conversas`}
      />

      <ConversasDialogContent>
        <TextField
          size="small"
          fullWidth
          placeholder="Buscar conversa..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={conversasFieldSx}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />

        <Box sx={{ maxHeight: "46vh", overflowY: "auto", mx: -1 }}>
          {conversationsQuery.isLoading ? (
            <Box sx={{ display: "grid", placeItems: "center", py: 5 }}>
              <CircularProgress size={22} />
            </Box>
          ) : filtered.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ py: 4 }}
            >
              Nenhuma conversa encontrada
            </Typography>
          ) : (
            filtered.map((conversation) => {
              const isSelected = selected.has(conversation.id);
              const name = conversationDisplayName(conversation);
              return (
                <ListItemButton
                  key={conversation.id}
                  onClick={() => toggle(conversation.id)}
                  sx={{ borderRadius: "10px", gap: 1.25, py: 1 }}
                >
                  <Avatar
                    src={conversation.avatarUrl ?? undefined}
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: "primary.main",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(name)}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                      {name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {formatPhoneDisplay(conversation.contactPhone)}
                    </Typography>
                  </Box>
                  {isSelected ? (
                    <CheckCircleIcon sx={{ fontSize: 20, color: "primary.main" }} />
                  ) : (
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        border: "2px solid",
                        borderColor: "text.disabled",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </ListItemButton>
              );
            })
          )}
        </Box>
      </ConversasDialogContent>

      <ConversasDialogActions>
        <Button color="secondary" disabled={forwarding} onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={selected.size === 0 || forwarding}
          onClick={() => void confirm()}
          startIcon={
            forwarding ? <CircularProgress size={14} color="inherit" /> : null
          }
        >
          Encaminhar ({selected.size})
        </Button>
      </ConversasDialogActions>
    </Dialog>
  );
}

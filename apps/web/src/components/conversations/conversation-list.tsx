"use client";

import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import SearchIcon from "@mui/icons-material/Search";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Fragment } from "react";
import {
  conversationDisplayName,
  formatRelativeTime,
  getInitials,
  thinScrollSx,
} from "./conversation-utils";
import type {
  ConversationDto,
  ConversationStatus,
} from "@/types/api/conversation";

type ConversationListProps = {
  conversations: ConversationDto[];
  loading: boolean;
  selectedId: string | null;
  title: string;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (conversation: ConversationDto) => void;
  onCreateNew: () => void;
  onCreateGroup: () => void;
};

const STATUS_DOT_COLORS: Record<ConversationStatus, string> = {
  open: "var(--mui-palette-success-main)",
  pending: "var(--mui-palette-warning-main)",
  closed: "var(--mui-palette-text-disabled)",
};

export default function ConversationList({
  conversations,
  loading,
  selectedId,
  title,
  search,
  onSearchChange,
  onSelect,
  onCreateNew,
  onCreateGroup,
}: ConversationListProps) {
  return (
    <Box
      sx={{
        height: "100%",
        maxHeight: "100%",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        minHeight: 0,
        overflow: "hidden",
        bgcolor: "background.paper",
        borderTopRightRadius: "8px",
      }}
    >
      <Box sx={{ px: 2, pt: 2, pb: 1.5, flexShrink: 0 }}>
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
            gap: 1,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, lineHeight: 1.2 }}
            >
              Mensagens
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {title} · {conversations.length}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.75} sx={{ flexShrink: 0 }}>
            <Tooltip title="Novo grupo">
              <IconButton
                aria-label="Novo grupo"
                onClick={onCreateGroup}
                size="small"
                sx={{
                  bgcolor: "action.hover",
                  color: "text.primary",
                  borderRadius: "10px",
                  width: 36,
                  height: 36,
                  "&:hover": { bgcolor: "action.selected" },
                }}
              >
                <GroupsOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Nova conversa">
              <IconButton
                aria-label="Nova conversa"
                onClick={onCreateNew}
                size="small"
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  borderRadius: "10px",
                  width: 36,
                  height: 36,
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                <AddOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <TextField
          size="small"
          fullWidth
          placeholder="Buscar por nome, telefone ou mensagem..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          sx={{
            "& .MuiOutlinedInput-root": {
              bgcolor: "background.default",
              borderRadius: "10px",
            },
          }}
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
      </Box>

      <Box sx={{ ...thinScrollSx, flex: "1 1 auto", minHeight: 0, height: "100%" }}>
        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress size={22} />
          </Box>
        ) : conversations.length === 0 ? (
          <Box sx={{ px: 2, py: 5 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              Nenhuma conversa encontrada
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ display: "flex", flexDirection: "column" }}>
            {conversations.map((conversation, index) => {
              const selected = conversation.id === selectedId;
              const name = conversationDisplayName(conversation);
              const unread = conversation.unreadCount > 0;

              return (
                <Fragment key={conversation.id}>
                  <ListItemButton
                    selected={selected}
                    onClick={() => onSelect(conversation)}
                    sx={{
                      alignItems: "flex-start",
                      gap: 1.25,
                      px: 2,
                      py: 1.4,
                      "&.Mui-selected": {
                        bgcolor:
                          "color-mix(in srgb, var(--mui-palette-primary-main) 4%, transparent)",
                        "&:hover": {
                          bgcolor:
                            "color-mix(in srgb, var(--mui-palette-primary-main) 7%, transparent)",
                        },
                      },
                    }}
                  >
                    <Box sx={{ position: "relative", flexShrink: 0, mt: 0.15 }}>
                      <Avatar
                        src={conversation.avatarUrl ?? undefined}
                        sx={{
                          width: 42,
                          height: 42,
                          bgcolor: "primary.main",
                          fontSize: 14,
                          fontWeight: 700,
                        }}
                      >
                        {getInitials(name)}
                      </Avatar>
                      <Box
                        sx={{
                          position: "absolute",
                          right: -2,
                          bottom: -2,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          bgcolor: "background.paper",
                          display: "grid",
                          placeItems: "center",
                          boxShadow: "0 0 0 1px var(--mui-palette-divider)",
                        }}
                      >
                        <WhatsAppIcon sx={{ fontSize: 12, color: "#25D366" }} />
                      </Box>
                    </Box>

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          variant="body2"
                          noWrap
                          sx={{
                            fontWeight: unread ? 800 : 700,
                            color: "text.primary",
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {name}
                        </Typography>
                        {conversation.chatType === "group" ? (
                          <Chip
                            size="small"
                            label="Grupo"
                            variant="outlined"
                            sx={{
                              height: 20,
                              fontSize: 10.5,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          />
                        ) : null}
                        <Typography
                          variant="caption"
                          sx={{
                            flexShrink: 0,
                            color: unread ? "primary.main" : "text.disabled",
                            fontWeight: unread ? 700 : 400,
                          }}
                        >
                          {formatRelativeTime(
                            conversation.lastMessageAt ?? conversation.updatedAt,
                          )}
                        </Typography>
                      </Stack>

                      <Stack
                        direction="row"
                        spacing={0.75}
                        sx={{ alignItems: "center", mt: 0.35 }}
                      >
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{
                            display: "block",
                            flex: 1,
                            minWidth: 0,
                            fontWeight: unread ? 600 : 400,
                            color: unread ? "text.primary" : "text.secondary",
                          }}
                        >
                          {conversation.lastMessageText ?? "Sem mensagens"}
                        </Typography>
                        {unread ? (
                          <Box
                            sx={{
                              minWidth: 18,
                              height: 18,
                              px: 0.5,
                              borderRadius: 999,
                              bgcolor: "primary.main",
                              color: "primary.contrastText",
                              display: "grid",
                              placeItems: "center",
                              fontSize: 10.5,
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {conversation.unreadCount > 99
                              ? "99+"
                              : conversation.unreadCount}
                          </Box>
                        ) : null}
                        <Box
                          aria-hidden
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            flexShrink: 0,
                            bgcolor: STATUS_DOT_COLORS[conversation.status],
                          }}
                        />
                      </Stack>
                    </Box>
                  </ListItemButton>

                  {index < conversations.length - 1 ? (
                    <Box
                      aria-hidden
                      sx={{
                        height: "1px",
                        mx: 2,
                        bgcolor:
                          "color-mix(in srgb, var(--mui-palette-divider) 55%, transparent)",
                        flexShrink: 0,
                      }}
                    />
                  ) : null}
                </Fragment>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
}

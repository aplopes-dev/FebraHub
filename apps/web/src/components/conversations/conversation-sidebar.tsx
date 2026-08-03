"use client";

import AllInboxOutlinedIcon from "@mui/icons-material/AllInboxOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import MarkChatUnreadOutlinedIcon from "@mui/icons-material/MarkChatUnreadOutlined";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { thinScrollSx } from "./conversation-utils";
import type {
  ConversationScope,
  ConversationStatus,
} from "@/types/api/conversation";

/** Estado de filtros do inbox (mapeado para a query da API na view). */
export type ConversationFiltersState = {
  scope: ConversationScope;
  status: ConversationStatus | "all";
  unreadOnly: boolean;
  search: string;
};

export const INITIAL_CONVERSATION_FILTERS: ConversationFiltersState = {
  scope: "all",
  status: "all",
  unreadOnly: false,
  search: "",
};

type ConversationSidebarProps = {
  filters: ConversationFiltersState;
  onFiltersChange: (filters: ConversationFiltersState) => void;
};

const SCOPE_ITEMS: Array<{
  id: ConversationScope;
  label: string;
  icon: typeof AllInboxOutlinedIcon;
}> = [
  { id: "all", label: "Todas", icon: AllInboxOutlinedIcon },
  { id: "mine", label: "Minhas conversas", icon: PersonOutlineOutlinedIcon },
  {
    id: "unassigned",
    label: "Não atribuídas",
    icon: PersonOffOutlinedIcon,
  },
];

const STATUS_ITEMS: Array<{
  id: ConversationStatus | "all";
  label: string;
  icon: typeof AllInboxOutlinedIcon;
}> = [
  { id: "all", label: "Todos os status", icon: AllInboxOutlinedIcon },
  { id: "open", label: "Abertas", icon: RadioButtonUncheckedIcon },
  { id: "pending", label: "Pendentes", icon: PauseCircleOutlineIcon },
  { id: "closed", label: "Fechadas", icon: CheckCircleOutlineIcon },
];

function NavItem({
  selected,
  icon: Icon,
  label,
  onClick,
}: {
  selected: boolean;
  icon: typeof AllInboxOutlinedIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <ListItemButton
      selected={selected}
      onClick={onClick}
      sx={{
        mx: 1,
        mb: 0.25,
        py: 1.1,
        px: 2,
        minHeight: 40,
        borderRadius: "8px",
        color: "text.secondary",
        "& .MuiListItemIcon-root": { color: "text.secondary" },
        "&.Mui-selected": {
          bgcolor: "action.selected",
          "&:hover": { bgcolor: "action.hover" },
        },
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <ListItemIcon sx={{ minWidth: 34 }}>
        <Icon sx={{ fontSize: 20 }} />
      </ListItemIcon>
      <ListItemText
        primary={label}
        slotProps={{
          primary: {
            sx: {
              fontSize: 13.5,
              fontWeight: selected ? 650 : 500,
              lineHeight: 1.25,
              color: "text.secondary",
            },
          },
        }}
      />
    </ListItemButton>
  );
}

export default function ConversationSidebar({
  filters,
  onFiltersChange,
}: ConversationSidebarProps) {
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
        borderRight: "1px solid",
        borderColor: "divider",
        borderTopLeftRadius: "8px",
      }}
    >
      <Box sx={{ px: 2, pt: 2, pb: 1.5, flexShrink: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
          Inbox
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Conversas do WhatsApp
        </Typography>
      </Box>

      <Box sx={{ ...thinScrollSx, flex: 1, minHeight: 0, pb: 2 }}>
        <Typography
          variant="overline"
          sx={{
            display: "block",
            px: 2.25,
            pt: 1,
            pb: 0.75,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "text.secondary",
          }}
        >
          Conversas
        </Typography>
        <List disablePadding>
          {SCOPE_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              selected={filters.scope === item.id}
              icon={item.icon}
              label={item.label}
              onClick={() => onFiltersChange({ ...filters, scope: item.id })}
            />
          ))}
          <NavItem
            selected={filters.unreadOnly}
            icon={MarkChatUnreadOutlinedIcon}
            label="Não lidas"
            onClick={() =>
              onFiltersChange({ ...filters, unreadOnly: !filters.unreadOnly })
            }
          />
        </List>

        <Typography
          variant="overline"
          sx={{
            display: "block",
            px: 2.25,
            pt: 2,
            pb: 0.75,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "text.secondary",
          }}
        >
          Status
        </Typography>
        <List disablePadding>
          {STATUS_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              selected={filters.status === item.id}
              icon={item.icon}
              label={item.label}
              onClick={() => onFiltersChange({ ...filters, status: item.id })}
            />
          ))}
        </List>
      </Box>
    </Box>
  );
}

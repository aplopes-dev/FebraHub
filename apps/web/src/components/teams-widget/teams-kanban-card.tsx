"use client";

import { useState } from "react";
import Link from "next/link";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import { Box, Button, Chip, Typography } from "@mui/material";
import { openRemoteIssue, teamsConversationUrl, type TeamsTaskRecord } from "@/lib/teams/teams-api";
import { teamsErrorMessage } from "@/lib/teams/teams-error";

type Props = {
  task: TeamsTaskRecord;
};

/** Tags e botões do card seguem as medidas do veicular (tag 22px, botão 32px). */
const CARD_TAG_SX = {
  height: 22,
  "& .MuiChip-label": { px: 0.75, fontSize: 11 },
} as const;

const CARD_BUTTON_SX = {
  height: 32,
  px: 1,
  fontSize: 12,
  minWidth: 0,
  "& .MuiButton-startIcon": { mr: 0.5 },
} as const;

export function TeamsKanbanCard({ task }: Props) {
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  const handleOpenRemoteIssue = async (remoteIssueLink: string) => {
    setOpening(true);
    setOpenError(null);
    try {
      await openRemoteIssue(remoteIssueLink);
    } catch (e) {
      setOpenError(teamsErrorMessage(e, "Não foi possível abrir a issue no Team Aplopes AI."));
    } finally {
      setOpening(false);
    }
  };

  return (
    <Box
      component="article"
      sx={{
        mb: 1,
        width: 236,
        maxWidth: "100%",
        borderRadius: "12px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        p: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Typography
          title={task.title}
          sx={{
            minWidth: 0,
            flex: 1,
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.375,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
          }}
        >
          {task.title}
        </Typography>
        <Box sx={{ display: "flex", flexShrink: 0, alignItems: "center", gap: 0.5 }}>
          {task.unreadCount > 0 ? (
            <Chip
              size="small"
              color="info"
              icon={<ChatBubbleOutlineRoundedIcon sx={{ fontSize: 13 }} />}
              label={`${task.unreadCount} ${task.unreadCount === 1 ? "nova" : "novas"}`}
              sx={CARD_TAG_SX}
            />
          ) : task.hasPendingMessage ? (
            <Chip
              size="small"
              color="warning"
              icon={<ChatBubbleOutlineRoundedIcon sx={{ fontSize: 13 }} />}
              label="Pendente"
              sx={CARD_TAG_SX}
            />
          ) : null}
        </Box>
      </Box>
      <Typography noWrap title={task.requesterName} sx={{ display: "block", mt: 0.5, fontSize: 12, lineHeight: 1.4, color: "text.secondary" }}>
        {task.requesterName}
      </Typography>
      <Typography noWrap title={task.workspaceName} sx={{ display: "block", mt: 0.25, fontSize: 12, lineHeight: 1.4, color: "text.secondary" }}>
        {task.workspaceName}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
        <PersonOutlineIcon sx={{ fontSize: 12, flexShrink: 0, color: "text.secondary" }} />
        <Typography noWrap color="text.secondary" sx={{ fontSize: 12, lineHeight: 1.4 }}>
          {task.agentName ?? "Sem agente"}
        </Typography>
      </Box>
      <Typography sx={{ display: "block", mt: 1, fontSize: 12, lineHeight: 1.4, color: "text.secondary" }}>
        Atualizada em{" "}
        {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(task.updatedAt))}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1 }}>
        <Button
          component={Link}
          href={teamsConversationUrl(task.id)}
          size="small"
          variant="outlined"
          startIcon={<ChatBubbleOutlineRoundedIcon sx={{ fontSize: 14 }} />}
          sx={CARD_BUTTON_SX}
        >
          Conversa
        </Button>
        {task.remoteIssueLink ? (
          <Button
            size="small"
            variant="outlined"
            startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
            sx={CARD_BUTTON_SX}
            disabled={opening}
            onClick={() => void handleOpenRemoteIssue(task.remoteIssueLink as string)}
          >
            {opening ? "Abrindo…" : "Team Ai Aplopes"}
          </Button>
        ) : null}
      </Box>

      {openError ? (
        <Typography
          sx={{
            display: "block",
            mt: 1,
            fontSize: 12,
            lineHeight: 1.4,
            borderRadius: "8px",
            border: "1px solid",
            borderColor: "error.main",
            bgcolor: "color-mix(in srgb, var(--mui-palette-error-main) 6%, transparent)",
            color: "error.main",
            px: 1.5,
            py: 1,
          }}
        >
          {openError}
        </Typography>
      ) : null}
    </Box>
  );
}

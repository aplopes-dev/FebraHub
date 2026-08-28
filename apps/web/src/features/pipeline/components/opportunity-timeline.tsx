"use client";

import CallIcon from "@mui/icons-material/Call";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutlined";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import NotesIcon from "@mui/icons-material/Notes";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@/ui";
import { findConsultant, type TimelineEntry, type TimelineType } from "@/lib/mock-db";

const ICONS: Record<TimelineType, ReactNode> = {
  criada: <FlagOutlinedIcon sx={{ fontSize: 15 }} />,
  etapa: <FlagOutlinedIcon sx={{ fontSize: 15 }} />,
  nota: <NotesIcon sx={{ fontSize: 15 }} />,
  ligacao: <CallIcon sx={{ fontSize: 15 }} />,
  whatsapp: <ChatBubbleOutlineIcon sx={{ fontSize: 15 }} />,
  email: <MailOutlineIcon sx={{ fontSize: 15 }} />,
  reuniao: <EventAvailableIcon sx={{ fontSize: 15 }} />,
  proposta: <DescriptionOutlinedIcon sx={{ fontSize: 15 }} />,
  acao_criada: <TaskAltIcon sx={{ fontSize: 15 }} />,
  acao_concluida: <TaskAltIcon sx={{ fontSize: 15 }} />,
  ganha: <EmojiEventsOutlinedIcon sx={{ fontSize: 15 }} />,
  perdida: <CancelOutlinedIcon sx={{ fontSize: 15 }} />,
  sistema: <SettingsOutlinedIcon sx={{ fontSize: 15 }} />,
};

const TONES: Partial<Record<TimelineType, string>> = {
  ganha: "success.main",
  perdida: "error.main",
  proposta: "warning.main",
  sistema: "text.disabled",
};

function formatMoment(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * A linha do tempo da oportunidade.
 *
 * É o registro que sobrevive à troca de consultor: quem assumir a carteira
 * amanhã precisa saber o que já foi dito, quando e por quem — senão liga
 * repetindo a mesma pergunta e o cliente percebe.
 */
export function OpportunityTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Nada registrado ainda.
      </Typography>
    );
  }

  return (
    <Stack spacing={0}>
      {entries.map((entry, index) => {
        const author = findConsultant(entry.authorId);
        const isLast = index === entries.length - 1;

        return (
          <Stack key={entry.id} direction="row" spacing={1.5}>
            <Stack sx={{ alignItems: "center", width: 28, flexShrink: 0 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: 1,
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  color: TONES[entry.type] ?? "text.secondary",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {ICONS[entry.type]}
              </Box>
              {!isLast ? (
                <Box sx={{ flex: 1, width: "1px", bgcolor: "divider", minHeight: 16 }} />
              ) : null}
            </Stack>

            <Stack spacing={0.25} sx={{ pb: isLast ? 0 : 2, flex: 1, minWidth: 0 }}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "baseline", flexWrap: "wrap" }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {entry.title}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.disabled" }}>
                  {formatMoment(entry.createdAt)}
                  {author ? ` · ${author.name}` : ""}
                </Typography>
              </Stack>
              {entry.description ? (
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {entry.description}
                </Typography>
              ) : null}
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
}

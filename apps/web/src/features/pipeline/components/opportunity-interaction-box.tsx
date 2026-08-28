"use client";

import { useState } from "react";
import CallIcon from "@mui/icons-material/Call";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import MailOutlineIcon from "@mui/icons-material/MailOutlined";
import NotesIcon from "@mui/icons-material/Notes";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { Button, Input, Stack } from "@/ui";
import type { TimelineType } from "@/lib/mock-db";

const KINDS: Array<{ id: TimelineType; label: string; icon: React.ReactNode }> = [
  { id: "ligacao", label: "Ligação", icon: <CallIcon sx={{ fontSize: 16 }} /> },
  { id: "whatsapp", label: "WhatsApp", icon: <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} /> },
  { id: "reuniao", label: "Reunião", icon: <EventAvailableIcon sx={{ fontSize: 16 }} /> },
  { id: "email", label: "E-mail", icon: <MailOutlineIcon sx={{ fontSize: 16 }} /> },
  { id: "nota", label: "Nota", icon: <NotesIcon sx={{ fontSize: 16 }} /> },
];

const TITLES: Partial<Record<TimelineType, string>> = {
  ligacao: "Ligação registrada",
  whatsapp: "Conversa por WhatsApp",
  reuniao: "Reunião realizada",
  email: "E-mail enviado",
  nota: "Nota do consultor",
};

/**
 * Registro rápido de interação.
 *
 * Fica no topo da linha do tempo, com uma caixa só: registrar o que aconteceu
 * tem que custar menos que não registrar, senão o histórico morre na primeira
 * semana de uso.
 */
export function OpportunityInteractionBox({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (input: { type: TimelineType; title: string; description: string }) => void;
  isSubmitting?: boolean;
}) {
  const [kind, setKind] = useState<TimelineType>("ligacao");
  const [text, setText] = useState("");

  function submit() {
    const description = text.trim();
    if (!description) return;
    onSubmit({ type: kind, title: TITLES[kind] ?? "Interação", description });
    setText("");
  }

  return (
    <Stack spacing={1}>
      <ToggleButtonGroup
        size="small"
        exclusive
        value={kind}
        onChange={(_event, next) => {
          if (next) setKind(next as TimelineType);
        }}
        aria-label="Tipo de interação"
      >
        {KINDS.map((item) => (
          <ToggleButton key={item.id} value={item.id} aria-label={item.label}>
            {item.icon}
            <span style={{ marginLeft: 6 }}>{item.label}</span>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Input
        size="small"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="O que aconteceu nesta conversa?"
        multiline
        minRows={2}
        fullWidth
      />

      <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
        <Button
          type="button"
          variant="contained"
          disabled={!text.trim() || isSubmitting}
          onClick={submit}
        >
          Registrar
        </Button>
      </Stack>
    </Stack>
  );
}

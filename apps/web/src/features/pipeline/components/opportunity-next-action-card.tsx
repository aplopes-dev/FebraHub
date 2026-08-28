"use client";

import { useState } from "react";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Button,
  Input,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@/ui";
import { isOverdue, type NextAction, type NextActionType } from "@/lib/mock-db";
import { formatIsoDate } from "@/lib/date";

const TYPES: Array<{ id: NextActionType; label: string }> = [
  { id: "ligar", label: "Ligar" },
  { id: "whatsapp", label: "Mandar WhatsApp" },
  { id: "reuniao", label: "Reunião" },
  { id: "proposta", label: "Refazer proposta" },
  { id: "follow_up", label: "Follow-up" },
];

/**
 * A próxima ação.
 *
 * Uma oportunidade aberta sem próxima ação é uma oportunidade que ninguém
 * está tocando — por isso o card cobra o agendamento em vez de apenas exibir
 * um vazio educado.
 */
export function OpportunityNextActionCard({
  action,
  onComplete,
  onCreate,
  isBusy,
}: {
  action?: NextAction;
  onComplete: (actionId: string, result: string) => void;
  onCreate: (input: { type: NextActionType; title: string; dueAt: string }) => void;
  isBusy?: boolean;
}) {
  const [type, setType] = useState<NextActionType>("ligar");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  if (action) {
    const overdue = isOverdue(action.dueAt);
    return (
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          borderRadius: 2,
          borderColor: overdue ? "error.main" : "divider",
          bgcolor: overdue ? "error.light" : "background.paper",
        }}
      >
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <AccessTimeIcon
              sx={{ fontSize: 16, color: overdue ? "error.dark" : "text.secondary" }}
            />
            <Typography
              variant="caption"
              sx={{ color: overdue ? "error.dark" : "text.secondary", fontWeight: 600 }}
            >
              {overdue ? "Vencida em " : "Vence em "}
              {formatIsoDate(action.dueAt)}
            </Typography>
          </Stack>

          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {action.title}
          </Typography>

          <Button
            type="button"
            variant="outlined"
            size="small"
            disabled={isBusy}
            onClick={() => onComplete(action.id, "Concluída pelo consultor.")}
          >
            Concluir ação
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderRadius: 2, borderColor: "warning.main", bgcolor: "warning.light" }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <WarningAmberIcon sx={{ fontSize: 16, color: "warning.dark" }} />
          <Typography variant="caption" sx={{ color: "warning.dark", fontWeight: 700 }}>
            Sem próxima ação
          </Typography>
        </Stack>

        <Select
          size="small"
          value={type}
          onChange={(event) => setType(event.target.value as NextActionType)}
          fullWidth
          inputProps={{ "aria-label": "Tipo da próxima ação" }}
        >
          {TYPES.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.label}
            </MenuItem>
          ))}
        </Select>

        <Input
          size="small"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="O que precisa ser feito"
          fullWidth
        />

        <Input
          size="small"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          fullWidth
          slotProps={{ htmlInput: { "aria-label": "Prazo" } }}
        />

        <Button
          type="button"
          variant="contained"
          size="small"
          disabled={!title.trim() || !dueDate || isBusy}
          onClick={() =>
            onCreate({
              type,
              title: title.trim(),
              dueAt: new Date(`${dueDate}T12:00:00`).toISOString(),
            })
          }
        >
          Agendar
        </Button>
      </Stack>
    </Paper>
  );
}

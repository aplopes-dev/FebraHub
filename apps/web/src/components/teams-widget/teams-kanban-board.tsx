"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useTeamsEvents } from "@/hooks/teams/use-teams-events";
import {
  fetchTeamsTasks,
  TEAMS_KANBAN_COLUMNS,
  TEAMS_SETTINGS_ROUTE,
  TEAMS_TASK_STATUS_LABELS,
  type TeamsTaskRecord,
} from "@/lib/teams/teams-api";
import { classifyTeamsError, teamsErrorMessage, type TeamsErrorKind } from "@/lib/teams/teams-error";
import { TeamsKanbanCard } from "./teams-kanban-card";

export function TeamsKanbanBoard() {
  const [tasks, setTasks] = useState<TeamsTaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<TeamsErrorKind | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setErrorKind(null);
    try {
      setTasks(await fetchTeamsTasks());
    } catch (e) {
      setError(teamsErrorMessage(e, "Erro ao carregar tarefas do Team Aplopes AI"));
      setErrorKind(classifyTeamsError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Chamada síncrona no corpo do efeito seria flagged pelo lint; agenda para o próximo tick.
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  useTeamsEvents(
    () => void load(),
    () => void load(),
  );

  const columns = useMemo(
    () =>
      TEAMS_KANBAN_COLUMNS.map((status) => ({
        id: status,
        label: TEAMS_TASK_STATUS_LABELS[status],
        items: tasks.filter((task) => task.status === status),
      })),
    [tasks],
  );

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Tarefas do Team Aplopes AI
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Acompanhamento somente leitura das tarefas criadas pelo widget de suporte — o status é
          definido no agentes.cybline.com.br.
        </Typography>
      </Box>

      {error ? (
        <Alert
          severity="error"
          action={
            errorKind === "auth" ? (
              <Button component={Link} href={TEAMS_SETTINGS_ROUTE} size="small" color="inherit">
                Reconectar integração
              </Button>
            ) : (
              <Button size="small" color="inherit" onClick={() => void load()}>
                Tentar novamente
              </Button>
            )
          }
        >
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "12px",
            bgcolor: "background.paper",
            p: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Kanban
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tasks.length} tarefa(s)
            </Typography>
          </Box>

          {!loading && !error && tasks.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Nenhuma tarefa criada ainda — inicie uma conversa pelo widget de suporte.
            </Typography>
          ) : null}

          <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 1 }}>
            {columns.map((column) => (
              <Box
                key={column.id}
                sx={{
                  width: 260,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "10px",
                  bgcolor: "action.hover",
                  border: "1px solid",
                  borderColor: "divider",
                  p: 1.25,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1, px: 0.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {column.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {column.items.length}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "column", minHeight: 40, maxHeight: 560, overflowY: "auto" }}>
                  {column.items.length === 0 ? (
                    <Typography variant="caption" color="text.disabled" sx={{ px: 0.5, py: 1 }}>
                      Sem tarefas
                    </Typography>
                  ) : (
                    column.items.map((task) => <TeamsKanbanCard key={task.id} task={task} />)
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Stack>
  );
}

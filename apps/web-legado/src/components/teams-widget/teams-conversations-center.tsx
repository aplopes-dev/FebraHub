"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AddCommentIcon from "@mui/icons-material/AddComment";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ElectricalServicesIcon from "@mui/icons-material/ElectricalServices";
import EventIcon from "@mui/icons-material/Event";
import ForumIcon from "@mui/icons-material/Forum";
import InboxIcon from "@mui/icons-material/Inbox";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SearchIcon from "@mui/icons-material/Search";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import {
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTeamsEvents } from "@/hooks/teams/use-teams-events";
import {
  classifyTeamsError,
  isTeamsConversationNotFound,
  teamsErrorMessage,
  type TeamsErrorKind,
} from "@/lib/teams/teams-error";
import {
  closeTeamsConversation,
  createTeamsConversation,
  fetchTeamsAgents,
  fetchTeamsConnection,
  fetchTeamsHistory,
  fetchTeamsTasks,
  markTeamsConversationRead,
  openRemoteIssue,
  reopenTeamsConversation,
  sendTeamsMessage,
  teamsConversationUrl,
  uploadTeamsAttachments,
  TEAMS_CONVERSAS_ROUTE,
  TEAMS_INTEGRATION_CHANGED_EVENT,
  TEAMS_KANBAN_COLUMNS,
  TEAMS_KANBAN_ROUTE,
  TEAMS_SETTINGS_ROUTE,
  type TeamsAgent,
  type TeamsMessage,
  type TeamsTaskRecord,
  type TeamsTaskStatus,
} from "@/lib/teams/teams-api";
import {
  isFinishedStatus,
  isUserAuthor,
  formatListTime,
  teamsThinScrollbarSx,
  TeamsChatThread,
  TeamsComposer,
  TeamsEmptyState,
  TeamsFilterChip,
  TeamsShortcutChips,
  TeamsStatusBadge,
  TeamsUnreadBadge,
  TEAMS_STATUS_DOT,
  TEAMS_STATUS_SHORT_LABELS,
} from "./teams-chat-ui";

/** Ações do cabeçalho da thread: 32px e 12px, como os botões `h-8 text-auxiliary` do veicular. */
const THREAD_ACTION_SX = {
  height: 32,
  px: 1,
  fontSize: 12,
  whiteSpace: "nowrap",
  minWidth: 0,
  "& .MuiButton-startIcon": { mr: 0.5 },
} as const;

const SIDEBAR_WIDTH_STORAGE_KEY = "teams-central-sidebar-width";
const SIDEBAR_DEFAULT_WIDTH = 320;
const SIDEBAR_MIN_WIDTH = 240;
const SIDEBAR_MAX_WIDTH = 560;

type StatusFilter = TeamsTaskStatus | "TODAS";

type Props = {
  initialConversationId: string | null;
};

/**
 * Central de conversas da integração Team Aplopes AI, no padrão do bloco de
 * conversas do CRM: sidebar esquerda com as issues como conversas (última
 * mensagem, hora, não lidas, status) e área central com o fluxo de mensagens
 * + composer. Sincroniza em tempo real via SSE e marca como lida ao abrir a
 * conversa.
 */
export function TeamsConversationsCenter({ initialConversationId }: Props) {
  const router = useRouter();
  const [connectionChecked, setConnectionChecked] = useState(false);
  const [connected, setConnected] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TeamsTaskRecord[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [agents, setAgents] = useState<TeamsAgent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<TeamsErrorKind | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(initialConversationId);
  const [composing, setComposing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("TODAS");
  const [showCalendar, setShowCalendar] = useState(false);
  const [search, setSearch] = useState("");

  const [messages, setMessages] = useState<TeamsMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [openingRemoteIssue, setOpeningRemoteIssue] = useState(false);
  const [resolving, setResolving] = useState(false);

  const [draft, setDraft] = useState("");
  const [replyAgentId, setReplyAgentId] = useState("");
  const [newDraft, setNewDraft] = useState("");
  const [newAgentId, setNewAgentId] = useState("");
  const [sending, setSending] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);

  const selectedIdRef = useRef<string | null>(selectedId);
  const tasksRef = useRef(tasks);
  useEffect(() => {
    selectedIdRef.current = selectedId;
    tasksRef.current = tasks;
  });

  const selectedTask = useMemo(() => tasks.find((task) => task.id === selectedId) ?? null, [tasks, selectedId]);

  const loadConnection = useCallback(async () => {
    try {
      const conn = await fetchTeamsConnection();
      setConnected(conn.status === "connected");
      setWorkspaceId(conn.workspaceId ?? null);
      setWorkspaceName(conn.workspaceName ?? null);
    } catch (e) {
      setError(teamsErrorMessage(e, "Erro ao verificar a conexão com o Team Aplopes AI"));
      setErrorKind(classifyTeamsError(e));
    } finally {
      setConnectionChecked(true);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      setTasks(await fetchTeamsTasks());
      setError(null);
      setErrorKind(null);
    } catch (e) {
      setError(teamsErrorMessage(e, "Erro ao carregar as conversas"));
      setErrorKind(classifyTeamsError(e));
    } finally {
      setTasksLoading(false);
    }
  }, []);

  const clearStaleSelection = useCallback(
    (conversationId: string) => {
      setMessages([]);
      setThreadError(null);
      setComposing(false);
      setSelectedId((prev) => (prev === conversationId ? null : prev));
      router.replace(TEAMS_CONVERSAS_ROUTE, { scroll: false });
    },
    [router],
  );

  const loadHistory = useCallback(
    async (conversationId: string, { silent = false } = {}) => {
      if (!silent) setMessagesLoading(true);
      setThreadError(null);
      try {
        setMessages(await fetchTeamsHistory(conversationId));
      } catch (e) {
        if (isTeamsConversationNotFound(e)) {
          clearStaleSelection(conversationId);
          return;
        }
        setThreadError(teamsErrorMessage(e, "Erro ao carregar as mensagens da conversa"));
      } finally {
        if (!silent) setMessagesLoading(false);
      }
    },
    [clearStaleSelection],
  );

  const markRead = useCallback(async (conversationId: string) => {
    // otimista: zera local na hora; o evento SSE conversation.read reconcilia as outras superfícies
    setTasks((prev) =>
      prev.map((task) => (task.id === conversationId ? { ...task, unreadCount: 0, hasPendingMessage: false } : task)),
    );
    try {
      await markTeamsConversationRead(conversationId);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    // Chamada síncrona no corpo do efeito seria flagged pelo lint; agenda para o próximo tick.
    const timer = setTimeout(() => {
      void loadConnection();
      void loadTasks();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadConnection, loadTasks]);

  // ?c= de outra organização / conversa removida: limpa a URL assim que a lista carregar.
  useEffect(() => {
    if (tasksLoading || error || !selectedId) return;
    if (tasks.some((task) => task.id === selectedId)) return;
    const timer = setTimeout(() => clearStaleSelection(selectedId), 0);
    return () => clearTimeout(timer);
  }, [tasks, tasksLoading, error, selectedId, clearStaleSelection]);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY));
    if (Number.isFinite(saved) && saved >= SIDEBAR_MIN_WIDTH && saved <= SIDEBAR_MAX_WIDTH) {
      const timer = setTimeout(() => setSidebarWidth(saved), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  const startSidebarResize = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = sidebarWidth;
      const clamp = (value: number) => Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, value));
      const onMove = (move: PointerEvent) => setSidebarWidth(clamp(startWidth + move.clientX - startX));
      const onUp = (up: PointerEvent) => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(clamp(startWidth + up.clientX - startX)));
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [sidebarWidth],
  );

  const resetSidebarWidth = useCallback(() => {
    setSidebarWidth(SIDEBAR_DEFAULT_WIDTH);
    window.localStorage.removeItem(SIDEBAR_WIDTH_STORAGE_KEY);
  }, []);

  useEffect(() => {
    const handler = () => {
      void loadConnection();
      void loadTasks();
    };
    window.addEventListener(TEAMS_INTEGRATION_CHANGED_EVENT, handler);
    return () => window.removeEventListener(TEAMS_INTEGRATION_CHANGED_EVENT, handler);
  }, [loadConnection, loadTasks]);

  useEffect(() => {
    if (!workspaceId || !connected) {
      const timer = setTimeout(() => setAgents([]), 0);
      return () => clearTimeout(timer);
    }
    let cancelled = false;
    fetchTeamsAgents(workspaceId)
      .then((list) => {
        if (!cancelled) setAgents(list);
      })
      .catch(() => {
        if (!cancelled) setAgents([]);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId, connected]);

  // Abrir conversa (?c= ou clique): só busca histórico depois que a lista confirmou
  // que o ID existe nesta organização — evita 404 em loop com ?c= stale.
  useEffect(() => {
    if (!selectedId || tasksLoading) return;
    if (!tasks.some((task) => task.id === selectedId)) return;
    const timer = setTimeout(() => {
      setDraft("");
      setReplyAgentId("");
      void loadHistory(selectedId);
      void markRead(selectedId);
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tasks validam o ID sem recarregar a cada poll
  }, [selectedId, tasksLoading, loadHistory, markRead]);

  useTeamsEvents(
    (payload) => {
      if (payload.type === "connection.updated") {
        void loadConnection();
        void loadTasks();
        return;
      }
      void loadTasks();
      const activeId = selectedIdRef.current;
      if (payload.type === "message.created" && payload.conversationId === activeId && activeId) {
        void loadHistory(activeId, { silent: true });
        void markRead(activeId);
      }
    },
    () => {
      void loadTasks();
      const activeId = selectedIdRef.current;
      if (activeId && tasksRef.current.some((task) => task.id === activeId)) {
        void loadHistory(activeId, { silent: true });
      }
    },
  );

  const selectConversation = useCallback(
    (conversationId: string | null) => {
      setComposing(false);
      setSelectedId(conversationId);
      router.replace(conversationId ? teamsConversationUrl(conversationId) : TEAMS_CONVERSAS_ROUTE, { scroll: false });
    },
    [router],
  );

  const startComposing = useCallback(() => {
    setComposing(true);
    setSelectedId(null);
    setNewAgentId("");
    router.replace(TEAMS_CONVERSAS_ROUTE, { scroll: false });
  }, [router]);

  const handleOpenRemoteIssue = async (remoteIssueLink: string) => {
    setOpeningRemoteIssue(true);
    setThreadError(null);
    try {
      await openRemoteIssue(remoteIssueLink);
    } catch (e) {
      setThreadError(teamsErrorMessage(e, "Não foi possível abrir a issue no Team Aplopes AI."));
    } finally {
      setOpeningRemoteIssue(false);
    }
  };

  // Concluir (CONCLUIDA) / Reabrir (EM_PROGRESSO) — otimista; o SSE task.updated
  // reconcilia as demais superfícies. Espelha no team via backend (best-effort).
  const handleToggleResolution = async () => {
    if (!selectedTask || resolving) return;
    const finished = isFinishedStatus(selectedTask.status);
    setResolving(true);
    setThreadError(null);
    try {
      if (finished) await reopenTeamsConversation(selectedTask.id);
      else await closeTeamsConversation(selectedTask.id);
      await loadTasks();
    } catch (e) {
      setThreadError(
        teamsErrorMessage(e, finished ? "Não foi possível reabrir a conversa." : "Não foi possível concluir a conversa."),
      );
    } finally {
      setResolving(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTask || sending) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSending(true);
    setThreadError(null);
    try {
      if (replyAgentId && replyAgentId !== (selectedTask.agentId ?? "")) {
        // destinatário diferente do responsável → abre uma NOVA conversa/issue já direcionada
        const agent = agents.find((candidate) => candidate.id === replyAgentId);
        const created = await createTeamsConversation({
          message: trimmed,
          screenContext: TEAMS_CONVERSAS_ROUTE,
          agentId: replyAgentId,
          agentName: agent?.name,
        });
        setDraft("");
        await loadTasks();
        selectConversation(created.id);
      } else {
        await sendTeamsMessage(selectedTask.id, trimmed);
        setDraft("");
        await loadHistory(selectedTask.id, { silent: true });
        void loadTasks();
      }
    } catch (e) {
      setThreadError(teamsErrorMessage(e, "Erro ao enviar mensagem"));
    } finally {
      setSending(false);
    }
  };

  const handleAttach = async (files: File[], message: string) => {
    if (!selectedTask || sending) return;
    setSending(true);
    setThreadError(null);
    try {
      await uploadTeamsAttachments(selectedTask.id, files, message);
      setDraft("");
      await loadHistory(selectedTask.id, { silent: true });
      void loadTasks();
    } catch (e) {
      setThreadError(teamsErrorMessage(e, "Não foi possível enviar o(s) anexo(s)."));
    } finally {
      setSending(false);
    }
  };

  const handleCreateConversation = async () => {
    const trimmed = newDraft.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    try {
      const agent = agents.find((candidate) => candidate.id === newAgentId);
      const created = await createTeamsConversation({
        message: trimmed,
        screenContext: TEAMS_CONVERSAS_ROUTE,
        agentId: newAgentId || undefined,
        agentName: agent?.name,
      });
      setNewDraft("");
      setNewAgentId("");
      await loadTasks();
      selectConversation(created.id);
    } catch (e) {
      setThreadError(teamsErrorMessage(e, "Erro ao criar a conversa"));
      setComposing(true);
    } finally {
      setSending(false);
    }
  };

  // Conversas de calendário vivem num filtro à parte (chip "Calendário"): ficam FORA
  // da lista/contagens normais e só aparecem quando o chip está ativo. Como as vazias
  // não são materializadas no backend, só existem aqui quando têm mensagem útil.
  const chatTasks = useMemo(() => tasks.filter((task) => task.source !== "CALENDAR"), [tasks]);
  const calendarTasks = useMemo(() => tasks.filter((task) => task.source === "CALENDAR"), [tasks]);

  const statusCounts = useMemo(() => {
    const counts = new Map<StatusFilter, { total: number; unread: number }>();
    counts.set("TODAS", { total: chatTasks.length, unread: chatTasks.reduce((acc, task) => acc + task.unreadCount, 0) });
    for (const status of TEAMS_KANBAN_COLUMNS) {
      const scoped = chatTasks.filter((task) => task.status === status);
      counts.set(status, { total: scoped.length, unread: scoped.reduce((acc, task) => acc + task.unreadCount, 0) });
    }
    return counts;
  }, [chatTasks]);

  const calendarUnread = useMemo(() => calendarTasks.reduce((acc, task) => acc + task.unreadCount, 0), [calendarTasks]);

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const scope = showCalendar ? calendarTasks : chatTasks;
    return scope.filter((task) => {
      if (!showCalendar && statusFilter !== "TODAS" && task.status !== statusFilter) return false;
      if (query && !task.title.toLowerCase().includes(query) && !(task.agentName ?? "").toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [chatTasks, calendarTasks, showCalendar, statusFilter, search]);

  const replyBlocked = selectedTask ? isFinishedStatus(selectedTask.status) : false;

  // ---------- estados de página inteira ----------
  if (connectionChecked && !connected && !error) {
    return (
      <CenterShell>
        <TeamsEmptyState
          icon={<ElectricalServicesIcon sx={{ fontSize: 20 }} />}
          title="Workspace não conectado"
          description="Conecte um workspace do Team Aplopes AI para conversar com os agentes e acompanhar as tarefas por aqui."
          action={
            <Button component={Link} href={TEAMS_SETTINGS_ROUTE} variant="contained">
              Configurar integração
            </Button>
          }
          sx={{ height: "60vh" }}
        />
      </CenterShell>
    );
  }

  return (
    <CenterShell>
      {error ? (
        <Box
          sx={{
            display: "flex",
            flexShrink: 0,
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1.5,
            borderBottom: "1px solid",
            borderColor: "error.main",
            bgcolor: "color-mix(in srgb, var(--mui-palette-error-main) 6%, transparent)",
            px: 2,
            py: 1.25,
          }}
        >
          <Typography variant="body2" color="error.main">
            {error}
          </Typography>
          {errorKind === "auth" ? (
            <Button component={Link} href={TEAMS_SETTINGS_ROUTE} size="small" variant="outlined">
              Reconectar integração
            </Button>
          ) : (
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                void loadConnection();
                void loadTasks();
              }}
            >
              Tentar novamente
            </Button>
          )}
        </Box>
      ) : null}

      <Box sx={{ display: "flex", minHeight: 0, flex: 1 }}>
        {/* ---------- sidebar esquerda (redimensionável no desktop) ---------- */}
        <Box
          sx={{
            display: selectedId || composing ? { xs: "none", lg: "flex" } : "flex",
            height: "100%",
            width: { xs: "100%", lg: sidebarWidth },
            flexShrink: 0,
            flexDirection: "column",
            bgcolor: "background.paper",
          }}
        >
          <Box sx={{ flexShrink: 0, borderBottom: "1px solid", borderColor: "divider", p: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  component="h2"
                  noWrap
                  sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}
                >
                  Conversas
                </Typography>
                <Typography noWrap color="text.secondary" sx={{ display: "block", fontSize: 11, lineHeight: 1.4 }}>
                  {workspaceName ? `Workspace ${workspaceName}` : "Team Aplopes AI"}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, alignItems: "center" }}>
                <IconButton
                  component={Link}
                  href={TEAMS_KANBAN_ROUTE}
                  title="Ver kanban"
                  sx={{ width: 32, height: 32, borderRadius: "8px" }}
                >
                  <ViewKanbanIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddCommentIcon sx={{ fontSize: 16 }} />}
                  onClick={startComposing}
                  sx={{ height: 32, fontSize: 12, whiteSpace: "nowrap" }}
                >
                  Nova
                </Button>
              </Stack>
            </Box>
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversa…"
              size="small"
              fullWidth
              sx={{
                mb: 1,
                "& .MuiOutlinedInput-root": { height: 36, bgcolor: "action.hover" },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Box sx={{ mx: -0.5, display: "flex", gap: 0.75, overflowX: "auto", px: 0.5, pb: 0.25, ...teamsThinScrollbarSx }}>
              {(["TODAS", ...TEAMS_KANBAN_COLUMNS] as StatusFilter[]).map((status) => {
                const meta = statusCounts.get(status) ?? { total: 0, unread: 0 };
                if (status !== "TODAS" && meta.total === 0 && statusFilter !== status) return null;
                const active = !showCalendar && statusFilter === status;
                return (
                  <TeamsFilterChip
                    key={status}
                    active={active}
                    onClick={() => {
                      setShowCalendar(false);
                      setStatusFilter(status);
                    }}
                  >
                    {status !== "TODAS" ? (
                      <Box component="span" sx={{ width: 6, height: 6, flexShrink: 0, borderRadius: "50%", bgcolor: TEAMS_STATUS_DOT[status] }} />
                    ) : null}
                    {status === "TODAS" ? "Todas" : TEAMS_STATUS_SHORT_LABELS[status]}
                    <Box component="span" sx={{ opacity: 0.7 }}>({meta.total})</Box>
                    <TeamsUnreadBadge count={meta.unread} />
                  </TeamsFilterChip>
                );
              })}
              {calendarTasks.length > 0 ? (
                <TeamsFilterChip
                  active={showCalendar}
                  title="Conversas geradas por itens de calendário"
                  onClick={() => setShowCalendar((v) => !v)}
                >
                  <EventIcon sx={{ fontSize: 12 }} />
                  Calendário
                  <Box component="span" sx={{ opacity: 0.7 }}>({calendarTasks.length})</Box>
                  <TeamsUnreadBadge count={calendarUnread} />
                </TeamsFilterChip>
              ) : null}
            </Box>
          </Box>

          <Box sx={{ minHeight: 0, flex: 1, overflowY: "auto" }}>
            {tasksLoading ? (
              <SidebarSkeleton />
            ) : visibleTasks.length === 0 ? (
              <TeamsEmptyState
                icon={<InboxIcon sx={{ fontSize: 20 }} />}
                title={tasks.length === 0 ? "Nenhuma conversa ainda" : "Nenhuma conversa neste filtro"}
                description={
                  tasks.length === 0
                    ? "Crie a primeira conversa — ela vira uma tarefa no board dos agentes."
                    : "Ajuste o filtro de status ou a busca para encontrar a conversa."
                }
                action={
                  tasks.length === 0 ? (
                    <Button size="small" variant="contained" onClick={startComposing}>
                      Nova conversa
                    </Button>
                  ) : undefined
                }
                sx={{ height: "auto", pt: 8 }}
              />
            ) : (
              visibleTasks.map((task) => (
                <ConversationListItem
                  key={task.id}
                  task={task}
                  active={task.id === selectedId}
                  onSelect={() => selectConversation(task.id)}
                />
              ))
            )}
          </Box>
        </Box>

        {/* alça de redimensionamento (desktop) — arraste ajusta, duplo clique restaura */}
        <Box
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionar lista de conversas"
          title="Arraste para redimensionar · duplo clique restaura"
          onPointerDown={startSidebarResize}
          onDoubleClick={resetSidebarWidth}
          sx={{
            display: { xs: (selectedId || composing) ? "none" : "none", lg: "block" },
            width: 4,
            flexShrink: 0,
            cursor: "col-resize",
            bgcolor: "divider",
            "&:hover": { bgcolor: "primary.main" },
          }}
        />

        {/* ---------- área central ---------- */}
        <Box
          sx={{
            minWidth: 0,
            flex: 1,
            display: selectedId || composing ? "flex" : { xs: "none", lg: "flex" },
            flexDirection: "column",
          }}
        >
          {composing ? (
            <NewConversationPane
              agents={agents}
              draft={newDraft}
              onDraftChange={setNewDraft}
              agentId={newAgentId}
              onAgentChange={setNewAgentId}
              sending={sending}
              error={threadError}
              onCancel={() => {
                setComposing(false);
                setThreadError(null);
              }}
              onCreate={handleCreateConversation}
            />
          ) : selectedTask ? (
            <>
              <Box
                sx={{
                  display: "flex",
                  flexShrink: 0,
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  px: { xs: 1.5, sm: 2 },
                  py: 1.25,
                }}
              >
                <Box sx={{ display: "flex", minWidth: 0, alignItems: "center", gap: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => selectConversation(null)}
                    aria-label="Voltar para a lista"
                    sx={{ display: { lg: "none" } }}
                  >
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>
                  <Box component="span" sx={{ width: 8, height: 8, flexShrink: 0, borderRadius: "50%", bgcolor: TEAMS_STATUS_DOT[selectedTask.status] }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography component="h2" noWrap sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25 }}>
                      {selectedTask.title}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
                      <PersonOutlineIcon sx={{ fontSize: 12, flexShrink: 0, color: "text.secondary" }} />
                      <Typography noWrap color="text.secondary" sx={{ fontSize: 11, lineHeight: 1.4 }}>
                        {selectedTask.agentName ?? "Sem agente atribuído"} · {selectedTask.requesterName}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexShrink: 0 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={resolving}
                    onClick={() => void handleToggleResolution()}
                    title={isFinishedStatus(selectedTask.status) ? "Reabrir conversa (voltar para Em progresso)" : "Concluir conversa"}
                    sx={THREAD_ACTION_SX}
                    startIcon={
                      isFinishedStatus(selectedTask.status) ? (
                        <RestartAltIcon sx={{ fontSize: 14 }} />
                      ) : (
                        <CheckCircleIcon sx={{ fontSize: 14 }} />
                      )
                    }
                  >
                    <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
                      {isFinishedStatus(selectedTask.status) ? "Reabrir" : "Concluir"}
                    </Box>
                  </Button>
                  <Box sx={{ display: { xs: "none", sm: "inline-flex" } }}>
                    <TeamsStatusBadge status={selectedTask.status} />
                  </Box>
                  {selectedTask.remoteIssueLink ? (
                    <Button
                      size="small"
                      disabled={openingRemoteIssue}
                      onClick={() => void handleOpenRemoteIssue(selectedTask.remoteIssueLink as string)}
                      sx={THREAD_ACTION_SX}
                      startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                    >
                      <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
                        {openingRemoteIssue ? "Abrindo…" : "Team Ai Aplopes"}
                      </Box>
                    </Button>
                  ) : null}
                </Stack>
              </Box>

              {messagesLoading ? (
                <Box sx={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", bgcolor: "action.hover" }}>
                  <Typography variant="body2" color="text.secondary">
                    Carregando mensagens…
                  </Typography>
                </Box>
              ) : (
                <TeamsChatThread
                  messages={messages}
                  conversationId={selectedTask.id}
                  agentName={selectedTask.agentName}
                  emptyState={
                    <TeamsEmptyState
                      icon={<ForumIcon sx={{ fontSize: 20 }} />}
                      title="Nenhuma mensagem nesta conversa"
                      description="Escreva abaixo para falar com o agente responsável."
                    />
                  }
                />
              )}

              {threadError ? (
                <Box sx={{ borderTop: "1px solid", borderColor: "error.main", bgcolor: "color-mix(in srgb, var(--mui-palette-error-main) 6%, transparent)", px: 2, py: 1 }}>
                  <Typography variant="body2" color="error.main">
                    {threadError}
                  </Typography>
                </Box>
              ) : null}

              {replyBlocked ? (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1.5,
                    borderTop: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    px: 2,
                    py: 1.5,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {selectedTask.status === "CONCLUIDA"
                      ? "Esta conversa foi concluída. Para um novo assunto, inicie outra conversa."
                      : "Esta conversa foi cancelada e não aceita mais mensagens."}
                  </Typography>
                  <Button size="small" variant="outlined" onClick={startComposing}>
                    Iniciar nova conversa
                  </Button>
                </Box>
              ) : (
                <TeamsComposer
                  value={draft}
                  onChange={setDraft}
                  onSend={handleSendReply}
                  onAttach={handleAttach}
                  sending={sending}
                  placeholder="Escreva sua mensagem…"
                  hint="Enter envia · Shift+Enter quebra linha"
                  topSlot={
                    agents.length > 0 ? (
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                        <Select
                          value={replyAgentId}
                          onChange={(e) => setReplyAgentId(e.target.value)}
                          displayEmpty
                          size="small"
                          sx={{ maxWidth: 288, flex: 1 }}
                        >
                          <MenuItem value="">{`Responder para ${selectedTask.agentName ?? "o agente responsável"}`}</MenuItem>
                          {agents
                            .filter((agent) => agent.id !== selectedTask.agentId)
                            .map((agent) => (
                              <MenuItem key={agent.id} value={agent.id}>
                                {`Nova conversa com ${agent.name}`}
                              </MenuItem>
                            ))}
                        </Select>
                        {replyAgentId && replyAgentId !== (selectedTask.agentId ?? "") ? (
                          <Typography variant="caption" sx={{ color: "warning.main" }}>
                            Será criada uma nova conversa direcionada a esse agente.
                          </Typography>
                        ) : null}
                      </Stack>
                    ) : undefined
                  }
                />
              )}
            </>
          ) : (
            <TeamsEmptyState
              icon={<ForumIcon sx={{ fontSize: 20 }} />}
              title="Selecione uma conversa"
              description="Escolha uma conversa na lista ao lado ou crie uma nova para falar com os agentes do Team Aplopes AI."
              action={
                <Button variant="contained" startIcon={<AddCommentIcon sx={{ fontSize: 16 }} />} onClick={startComposing}>
                  Nova conversa
                </Button>
              }
              sx={{ bgcolor: "action.hover" }}
            />
          )}
        </Box>
      </Box>
    </CenterShell>
  );
}

/**
 * Casca full-bleed da central: trava a altura EXATA disponível entre o topo
 * do painel e o fim do container de rolagem, medida em runtime — a rolagem
 * fica SÓ dentro da lista de conversas e do fluxo de mensagens; o composer
 * fica sempre visível.
 */
function CenterShell({ children }: { children: React.ReactNode }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const measure = () => {
      const el = shellRef.current;
      if (!el) return;
      const SAFETY_PX = 4;
      let scroller: HTMLElement | null = el.parentElement;
      while (scroller && scroller !== document.body) {
        const overflowY = getComputedStyle(scroller).overflowY;
        if (overflowY === "auto" || overflowY === "scroll") break;
        scroller = scroller.parentElement;
      }
      const available = scroller ? scroller.clientHeight : window.innerHeight - el.getBoundingClientRect().top;
      const next = Math.max(360, Math.floor(available) - SAFETY_PX);
      setHeight((prev) => (prev !== null && Math.abs(prev - next) <= 1 ? prev : next));
    };
    // 1ª medição no próximo frame; remedições cobrem fontes/abas assentando e resize/rotação.
    const raf = requestAnimationFrame(measure);
    const settle = window.setTimeout(measure, 250);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <Box
      ref={shellRef}
      sx={{
        m: { xs: -2, sm: -3 },
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        height: height !== null ? `${height}px` : "calc(100dvh - 14rem)",
      }}
    >
      {children}
    </Box>
  );
}

function ConversationListItem({
  task,
  active,
  onSelect,
}: {
  task: TeamsTaskRecord;
  active: boolean;
  onSelect: () => void;
}) {
  const lastAt = task.lastMessage?.createdAt ?? task.updatedAt;
  const preview = task.lastMessage
    ? `${isUserAuthor(task.lastMessage.authorType) ? "Você: " : ""}${task.lastMessage.content}`
    : "Sem mensagens";
  const waitingUser = task.status === "AGUARDANDO_USUARIO" || task.hasPendingMessage;

  return (
    <Box
      component="button"
      type="button"
      onClick={onSelect}
      sx={{
        display: "flex",
        width: "100%",
        alignItems: "flex-start",
        gap: 1.25,
        border: "none",
        borderLeft: "2px solid",
        borderLeftColor: active ? "primary.main" : "transparent",
        bgcolor: active ? "action.selected" : "transparent",
        px: 1.5,
        py: 1.5,
        textAlign: "left",
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Box sx={{ position: "relative", mt: 0.75, display: "flex", flexShrink: 0 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: TEAMS_STATUS_DOT[task.status] }} />
        {waitingUser && !isFinishedStatus(task.status) ? (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              bgcolor:
                "color-mix(in srgb, var(--mui-palette-warning-main) 60%, transparent)",
              animation: "teams-dot-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite",
              "@keyframes teams-dot-ping": {
                "75%, 100%": { transform: "scale(2)", opacity: 0 },
              },
            }}
          />
        ) : null}
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography noWrap sx={{ fontSize: 14, lineHeight: 1.5, fontWeight: task.unreadCount > 0 ? 600 : 500 }}>
            {task.title}
          </Typography>
          <Typography sx={{ flexShrink: 0, fontSize: 10, color: "text.secondary" }}>
            {formatListTime(lastAt)}
          </Typography>
        </Box>
        <Box sx={{ mt: 0.25, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography noWrap sx={{ fontSize: 12, lineHeight: 1.4, color: task.unreadCount > 0 ? "text.primary" : "text.secondary" }}>
            {preview}
          </Typography>
          <TeamsUnreadBadge count={task.unreadCount} />
        </Box>
        <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 0.75 }}>
          <Typography noWrap color="text.secondary" sx={{ fontSize: 10, lineHeight: 1.4 }}>
            {TEAMS_STATUS_SHORT_LABELS[task.status]}
            {task.agentName ? ` · ${task.agentName}` : ""}
          </Typography>
          {waitingUser && !isFinishedStatus(task.status) ? (
            <Chip size="small" color="warning" label="Aguardando você" sx={{ height: 16, "& .MuiChip-label": { fontSize: 9, px: 0.75 } }} />
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

function NewConversationPane({
  agents,
  draft,
  onDraftChange,
  agentId,
  onAgentChange,
  sending,
  error,
  onCancel,
  onCreate,
}: {
  agents: TeamsAgent[];
  draft: string;
  onDraftChange: (value: string) => void;
  agentId: string;
  onAgentChange: (value: string) => void;
  sending: boolean;
  error: string | null;
  onCancel: () => void;
  onCreate: () => void | Promise<void>;
}) {
  return (
    <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column", bgcolor: "action.hover" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper", px: { xs: 1.5, sm: 2 }, py: 1.25 }}>
        <IconButton size="small" onClick={onCancel} aria-label="Voltar">
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Nova conversa
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Sua solicitação vira uma tarefa no board dos agentes.
          </Typography>
        </Box>
      </Box>
      <Box sx={{ minHeight: 0, flex: 1, overflowY: "auto", p: 2 }}>
        <Box sx={{ mx: "auto", display: "flex", width: "100%", maxWidth: 560, flexDirection: "column", gap: 1.5, borderRadius: "12px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper", p: 2, boxShadow: 1 }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 0.75, fontWeight: 600 }}>
              Atalhos rápidos
            </Typography>
            <TeamsShortcutChips onPick={onDraftChange} />
          </Box>
          {error ? (
            <Typography variant="body2" color="error.main">
              {error}
            </Typography>
          ) : null}
        </Box>
      </Box>
      {/* rodapé fixo: seletor de agente + input sempre visíveis, sem rolagem da página */}
      <TeamsComposer
        value={draft}
        onChange={onDraftChange}
        onSend={onCreate}
        sending={sending}
        placeholder="Descreva sua solicitação com o máximo de contexto…"
        hint="Enter envia · Shift+Enter quebra linha"
        autoFocus
        topSlot={
          <Select value={agentId} onChange={(e) => onAgentChange(e.target.value)} displayEmpty size="small" sx={{ maxWidth: 384 }}>
            <MenuItem value="">Agente padrão do workspace</MenuItem>
            {agents.map((agent) => (
              <MenuItem key={agent.id} value={agent.id}>
                {agent.name}
              </MenuItem>
            ))}
          </Select>
        }
      />
    </Box>
  );
}

function SidebarSkeleton() {
  return (
    <Stack spacing={0.5} sx={{ p: 1.5 }}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Box key={index} sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, px: 0.5, py: 1.25, opacity: 0.6 }}>
          <Box sx={{ mt: 0.5, width: 10, height: 10, borderRadius: "50%", bgcolor: "action.disabledBackground" }} />
          <Box sx={{ flex: 1 }}>
            <Box sx={{ height: 12, width: "75%", borderRadius: "4px", bgcolor: "action.disabledBackground", mb: 0.75 }} />
            <Box sx={{ height: 10, width: "100%", borderRadius: "4px", bgcolor: "action.hover" }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

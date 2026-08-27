"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AddCommentIcon from "@mui/icons-material/AddComment";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import RemoveIcon from "@mui/icons-material/Remove";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import {
  Box,
  Button,
  Chip,
  ClickAwayListener,
  Fab,
  IconButton,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { useAuth } from "@/components/auth/auth-context";
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
  reopenTeamsConversation,
  sendTeamsMessage,
  teamsConversationUrl,
  uploadTeamsAttachments,
  TEAMS_CONVERSAS_ROUTE,
  TEAMS_INTEGRATION_CHANGED_EVENT,
  TEAMS_KANBAN_COLUMNS,
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

const STORAGE_KEY_PREFIX = "teams-widget-conversation-id";

/** Ações do cabeçalho do painel: 32x32 com ícone de 16px (`h-8 w-8` do veicular). */
const HEADER_ICON_SX = {
  width: 32,
  height: 32,
  borderRadius: "6px",
} as const;

/** Rodapé estreito (384px): botões de 32px sem quebra de linha, como no veicular. */
const FOOTER_BUTTON_SX = {
  height: 32,
  px: 1,
  fontSize: 12,
  whiteSpace: "nowrap",
  minWidth: 0,
  "& .MuiButton-startIcon": { mr: 0.5 },
} as const;

/** Chave por organização — evita reabrir conversa de outra org após troca de login. */
function conversationStorageKey(organizationId: string | null | undefined): string {
  return organizationId ? `${STORAGE_KEY_PREFIX}:${organizationId}` : STORAGE_KEY_PREFIX;
}

function readSavedConversationId(organizationId: string | null | undefined): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(conversationStorageKey(organizationId));
}

function writeSavedConversationId(organizationId: string | null | undefined, conversationId: string) {
  window.localStorage.setItem(conversationStorageKey(organizationId), conversationId);
}

function clearSavedConversationId(organizationId: string | null | undefined) {
  window.localStorage.removeItem(conversationStorageKey(organizationId));
}

type WidgetView = { kind: "list" } | { kind: "chat"; conversationId: string } | { kind: "new" };
type StatusFilter = TeamsTaskStatus | "TODAS";

/**
 * Posição livre do widget na tela (arraste pelo botão flutuante ou pelo
 * cabeçalho do painel). Ancorada no canto inferior-direito do container
 * (right/bottom em px). Persistida em localStorage.
 */
const POSITION_STORAGE_KEY = "teams-widget-position";
const POSITION_MARGIN = 8;
const DRAG_THRESHOLD_PX = 6;

type WidgetPosition = { right: number; bottom: number };

const DEFAULT_POSITION: WidgetPosition = { right: 16, bottom: 16 };

function clampPosition(pos: WidgetPosition, expanded: boolean): WidgetPosition {
  if (typeof window === "undefined") return pos;
  const panelWidth = Math.min(384, window.innerWidth - 32);
  const panelHeight = Math.min(544, window.innerHeight - 112) + 60;
  const reservedWidth = expanded ? panelWidth : 48;
  const reservedHeight = expanded ? panelHeight : 48;
  return {
    right: Math.min(
      Math.max(pos.right, POSITION_MARGIN),
      Math.max(POSITION_MARGIN, window.innerWidth - reservedWidth - POSITION_MARGIN),
    ),
    bottom: Math.min(
      Math.max(pos.bottom, POSITION_MARGIN),
      Math.max(POSITION_MARGIN, window.innerHeight - reservedHeight - POSITION_MARGIN),
    ),
  };
}

/**
 * Widget flutuante da integração Team Aplopes AI — acompanha e responde issues
 * de qualquer tela. Minimizado mostra o total de não lidas; expandido tem chips
 * de status do kanban com contadores, lista de conversas, conversa embutida,
 * criação de nova conversa com atalhos e escolha de agente, e link pra central.
 * Reage a conectar/trocar/desconectar workspace via SSE + evento client-side.
 * Arrastável pelo botão flutuante ou pelo cabeçalho do painel.
 */
export function TeamsWidget() {
  const pathname = usePathname();
  const { organization } = useAuth();
  const organizationId = organization?.id ?? null;

  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<TeamsErrorKind | null>(null);

  const [tasks, setTasks] = useState<TeamsTaskRecord[]>([]);
  const [tasksReady, setTasksReady] = useState(false);
  const [agents, setAgents] = useState<TeamsAgent[]>([]);
  const [view, setView] = useState<WidgetView>({ kind: "list" });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("TODAS");

  const [messages, setMessages] = useState<TeamsMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [replyAgentId, setReplyAgentId] = useState("");
  const [newDraft, setNewDraft] = useState("");
  const [newAgentId, setNewAgentId] = useState("");
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);

  const [position, setPosition] = useState<WidgetPosition>(DEFAULT_POSITION);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startPos: WidgetPosition;
    moved: boolean;
  } | null>(null);
  const justDraggedRef = useRef(false);

  const viewRef = useRef<WidgetView>(view);
  const expandedRef = useRef(expanded);
  const restoredRef = useRef(false);
  const organizationIdRef = useRef(organizationId);
  useEffect(() => {
    viewRef.current = view;
    expandedRef.current = expanded;
    organizationIdRef.current = organizationId;
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(POSITION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as WidgetPosition;
        if (typeof parsed.right === "number" && typeof parsed.bottom === "number") {
          // setState síncrono aqui seria flagged pelo lint; agenda para o próximo tick.
          const timer = setTimeout(() => setPosition(clampPosition(parsed, false)), 0);
          return () => clearTimeout(timer);
        }
      }
    } catch {
      // posição corrompida — fica no padrão
    }
  }, []);

  useEffect(() => {
    const onResize = () => setPosition((prev) => clampPosition(prev, expandedRef.current));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const startDrag = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startPos: position,
      moved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const moveDrag = (e: ReactPointerEvent<HTMLElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const deltaX = e.clientX - drag.startX;
    const deltaY = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) return;
    drag.moved = true;
    setPosition(
      clampPosition(
        { right: drag.startPos.right - deltaX, bottom: drag.startPos.bottom - deltaY },
        expandedRef.current,
      ),
    );
  };

  const endDrag = (e: ReactPointerEvent<HTMLElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragStateRef.current = null;
    if (drag.moved) {
      justDraggedRef.current = true;
      window.setTimeout(() => {
        justDraggedRef.current = false;
      }, 0);
      setPosition((prev) => {
        try {
          window.localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(prev));
        } catch {
          // storage indisponível — posição vale só pra sessão
        }
        return prev;
      });
    }
  };

  const startHeaderDrag = (e: ReactPointerEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select")) return;
    startDrag(e);
  };

  const activeConversationId = view.kind === "chat" ? view.conversationId : null;
  const activeTask = useMemo(
    () => (activeConversationId ? (tasks.find((task) => task.id === activeConversationId) ?? null) : null),
    [tasks, activeConversationId],
  );
  const totalUnread = useMemo(() => tasks.reduce((acc, task) => acc + task.unreadCount, 0), [tasks]);

  const loadConnection = useCallback(async () => {
    try {
      const conn = await fetchTeamsConnection();
      setConnected(conn.status === "connected");
      setWorkspaceId(conn.workspaceId ?? null);
      setWorkspaceName(conn.workspaceName ?? null);
      setError(null);
      setErrorKind(null);
      if (conn.status !== "connected") {
        setTasks([]);
        setView({ kind: "list" });
        clearSavedConversationId(organizationIdRef.current);
      }
    } catch (e) {
      setError(teamsErrorMessage(e, "Erro ao verificar conexão com o Team Aplopes AI"));
      setErrorKind(classifyTeamsError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      setTasks(await fetchTeamsTasks());
    } catch {
      return;
    } finally {
      setTasksReady(true);
    }
  }, []);

  const abandonStaleConversation = useCallback((conversationId: string) => {
    clearSavedConversationId(organizationIdRef.current);
    setMessages([]);
    setActionError(null);
    setView((prev) => (prev.kind === "chat" && prev.conversationId === conversationId ? { kind: "list" } : prev));
  }, []);

  const loadHistory = useCallback(
    async (conversationId: string) => {
      try {
        setMessages(await fetchTeamsHistory(conversationId));
      } catch (e) {
        if (isTeamsConversationNotFound(e)) {
          abandonStaleConversation(conversationId);
          return;
        }
        setActionError(teamsErrorMessage(e, "Erro ao carregar histórico da conversa"));
      }
    },
    [abandonStaleConversation],
  );

  const markRead = useCallback(async (conversationId: string) => {
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
    const timer = setTimeout(() => {
      void loadConnection();
      void loadTasks();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadConnection, loadTasks]);

  useEffect(() => {
    const handler = () => {
      setLoading(true);
      setTasksReady(false);
      restoredRef.current = false;
      void loadConnection();
      void loadTasks();
    };
    window.addEventListener(TEAMS_INTEGRATION_CHANGED_EVENT, handler);
    return () => window.removeEventListener(TEAMS_INTEGRATION_CHANGED_EVENT, handler);
  }, [loadConnection, loadTasks]);

  useEffect(() => {
    if (!connected || !workspaceId) {
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
  }, [connected, workspaceId]);

  // Troca de organização: limpa restauração e reavalia o ID salvo do novo escopo.
  useEffect(() => {
    restoredRef.current = false;
    const timer = setTimeout(() => setView({ kind: "list" }), 0);
    return () => clearTimeout(timer);
  }, [organizationId]);

  // Restaura a última conversa só se ela ainda existir nesta organização (evita 404 em loop).
  useEffect(() => {
    if (!tasksReady || restoredRef.current) return;
    restoredRef.current = true;
    const savedId = readSavedConversationId(organizationId);
    if (!savedId) return;
    const timer = setTimeout(() => {
      if (tasks.some((task) => task.id === savedId)) {
        setView({ kind: "chat", conversationId: savedId });
      } else {
        clearSavedConversationId(organizationId);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [tasksReady, tasks, organizationId]);

  // abrir conversa: histórico + marcar lida
  useEffect(() => {
    if (view.kind !== "chat") return;
    const timer = setTimeout(() => {
      setDraft("");
      setReplyAgentId("");
      setActionError(null);
      setMessages([]);
      void loadHistory(view.conversationId);
      if (expandedRef.current) void markRead(view.conversationId);
    }, 0);
    writeSavedConversationId(organizationIdRef.current, view.conversationId);
    return () => clearTimeout(timer);
  }, [view, loadHistory, markRead]);

  useTeamsEvents(
    (payload) => {
      if (payload.type === "connection.updated") {
        void loadConnection();
        void loadTasks();
        return;
      }
      void loadTasks();
      const current = viewRef.current;
      if (
        payload.type === "message.created" &&
        current.kind === "chat" &&
        payload.conversationId === current.conversationId
      ) {
        void loadHistory(current.conversationId);
        if (expandedRef.current) void markRead(current.conversationId);
      }
    },
    () => {
      void loadTasks();
      const current = viewRef.current;
      if (current.kind === "chat") void loadHistory(current.conversationId);
    },
  );

  const openConversation = (conversationId: string) => {
    setView({ kind: "chat", conversationId });
  };

  const backToList = () => {
    setView({ kind: "list" });
    setActionError(null);
    clearSavedConversationId(organizationIdRef.current);
  };

  const handleToggleResolution = async () => {
    if (!activeConversationId || !activeTask || resolving) return;
    const finished = isFinishedStatus(activeTask.status);
    setResolving(true);
    setActionError(null);
    try {
      if (finished) await reopenTeamsConversation(activeConversationId);
      else await closeTeamsConversation(activeConversationId);
      await loadTasks();
    } catch (e) {
      setActionError(teamsErrorMessage(e, finished ? "Erro ao reabrir a conversa" : "Erro ao concluir a conversa"));
    } finally {
      setResolving(false);
    }
  };

  const handleAttach = async (files: File[], message: string) => {
    if (!activeConversationId || sending) return;
    setSending(true);
    setActionError(null);
    try {
      await uploadTeamsAttachments(activeConversationId, files, message);
      setDraft("");
      await loadHistory(activeConversationId);
      void loadTasks();
    } catch (e) {
      setActionError(teamsErrorMessage(e, "Erro ao enviar anexo"));
    } finally {
      setSending(false);
    }
  };

  const handleSendReply = async () => {
    if (!activeConversationId || sending) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSending(true);
    setActionError(null);
    try {
      if (replyAgentId && replyAgentId !== (activeTask?.agentId ?? "")) {
        const agent = agents.find((candidate) => candidate.id === replyAgentId);
        const created = await createTeamsConversation({
          message: trimmed,
          screenContext: pathname,
          agentId: replyAgentId,
          agentName: agent?.name,
        });
        setDraft("");
        await loadTasks();
        openConversation(created.id);
      } else {
        await sendTeamsMessage(activeConversationId, trimmed);
        setDraft("");
        await loadHistory(activeConversationId);
        void loadTasks();
      }
    } catch (e) {
      setActionError(teamsErrorMessage(e, "Erro ao enviar mensagem"));
    } finally {
      setSending(false);
    }
  };

  const handleCreateConversation = async () => {
    const trimmed = newDraft.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setActionError(null);
    try {
      const agent = agents.find((candidate) => candidate.id === newAgentId);
      const created = await createTeamsConversation({
        message: trimmed,
        screenContext: pathname,
        agentId: newAgentId || undefined,
        agentName: agent?.name,
      });
      setNewDraft("");
      setNewAgentId("");
      await loadTasks();
      openConversation(created.id);
    } catch (e) {
      setActionError(teamsErrorMessage(e, "Erro ao criar a conversa"));
    } finally {
      setSending(false);
    }
  };

  const statusChips = useMemo(() => {
    const chips: Array<{ id: StatusFilter; label: string; total: number; unread: number }> = [
      {
        id: "TODAS",
        label: "Todas",
        total: tasks.length,
        unread: tasks.reduce((acc, task) => acc + task.unreadCount, 0),
      },
    ];
    for (const status of TEAMS_KANBAN_COLUMNS) {
      const scoped = tasks.filter((task) => task.status === status);
      if (scoped.length === 0) continue;
      chips.push({
        id: status,
        label: TEAMS_STATUS_SHORT_LABELS[status],
        total: scoped.length,
        unread: scoped.reduce((acc, task) => acc + task.unreadCount, 0),
      });
    }
    return chips;
  }, [tasks]);

  const visibleTasks = useMemo(
    () => (statusFilter === "TODAS" ? tasks : tasks.filter((task) => task.status === statusFilter)),
    [tasks, statusFilter],
  );

  const toggleExpanded = () => {
    if (justDraggedRef.current) return; // o gesto foi arrasto, não clique
    const next = !expanded;
    setExpanded(next);
    if (next) {
      setPosition((prev) => clampPosition(prev, true));
      void loadConnection();
      void loadTasks();
      const current = viewRef.current;
      if (current.kind === "chat") void markRead(current.conversationId);
    }
  };

  const collapseIfExpanded = (event: MouseEvent | TouchEvent) => {
    if (!expandedRef.current || justDraggedRef.current) return;
    // Selects/Menus do MUI renderizam em portal fora do widget — não tratar como "fora".
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest(
        ".MuiPopover-root, .MuiModal-root, .MuiMenu-root, .MuiPopper-root, .MuiDialog-root",
      )
    ) {
      return;
    }
    setExpanded(false);
  };

  if (loading && !expanded) return null;

  const replyBlocked = activeTask ? isFinishedStatus(activeTask.status) : false;

  return (
    <ClickAwayListener onClickAway={collapseIfExpanded} mouseEvent="onMouseDown" touchEvent="onTouchStart">
      <Box sx={{ position: "fixed", zIndex: 1300, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1.5, right: position.right, bottom: position.bottom }}>
      {expanded ? (
        <Box
          sx={{
            display: "flex",
            height: "min(34rem, calc(100dvh - 7rem))",
            width: "min(24rem, calc(100vw - 2rem))",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: "12px",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            boxShadow: 8,
          }}
        >
          {/* -------- header (alça de arrasto do painel) -------- */}
          <Box
            onPointerDown={startHeaderDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            title="Arraste para reposicionar"
            sx={{
              display: "flex",
              cursor: "grab",
              touchAction: "none",
              userSelect: "none",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              borderBottom: "1px solid",
              borderColor: "divider",
              px: 1.75,
              py: 1.25,
              "&:active": { cursor: "grabbing" },
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.25 }}>
                Team Aplopes AI
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Box component="span" sx={{ width: 6, height: 6, flexShrink: 0, borderRadius: "50%", bgcolor: connected ? "success.main" : "error.main" }} />
                <Typography color="text.secondary" sx={{ fontSize: 11, lineHeight: 1.4 }}>
                  {connected ? (workspaceName ?? "Workspace conectado") : "Desconectado"}
                  {connected && totalUnread > 0 ? (
                    <Box component="span" sx={{ fontWeight: 600, color: "primary.main" }}>
                      {" "}
                      · {totalUnread} {totalUnread === 1 ? "nova" : "novas"}
                    </Box>
                  ) : null}
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={0.25} sx={{ flexShrink: 0 }}>
              {connected ? (
                <IconButton
                  onClick={() => {
                    setView({ kind: "new" });
                    setActionError(null);
                  }}
                  title="Nova conversa"
                  aria-label="Nova conversa"
                  sx={HEADER_ICON_SX}
                >
                  <AddCommentIcon sx={{ fontSize: 16 }} />
                </IconButton>
              ) : null}
              <IconButton onClick={toggleExpanded} aria-label="Minimizar" sx={HEADER_ICON_SX}>
                <RemoveIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
          </Box>

          {/* -------- corpo -------- */}
          <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }}>
            {loading ? (
              <Stack spacing={1} sx={{ p: 2 }}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} variant="rounded" height={48} />
                ))}
              </Stack>
            ) : error ? (
              <TeamsEmptyState
                title="Não foi possível carregar"
                description={error}
                action={
                  errorKind === "auth" ? (
                    <Button component={Link} href={TEAMS_SETTINGS_ROUTE} size="small" variant="outlined">
                      Reconectar integração
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setLoading(true);
                        void loadConnection();
                        void loadTasks();
                      }}
                    >
                      Tentar novamente
                    </Button>
                  )
                }
              />
            ) : !connected ? (
              <TeamsEmptyState
                icon={<ChatBubbleOutlineRoundedIcon sx={{ fontSize: 20 }} />}
                title="Workspace não conectado"
                description="Conecte um workspace do Team Aplopes AI para conversar com os agentes daqui de qualquer tela."
                action={
                  <Button component={Link} href={TEAMS_SETTINGS_ROUTE} size="small" variant="contained">
                    Configurar integração
                  </Button>
                }
              />
            ) : view.kind === "new" ? (
              <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }}>
                <SubHeader onBack={backToList} title="Nova conversa" subtitle="Vira uma tarefa no board dos agentes" />
                <Stack spacing={1.5} sx={{ minHeight: 0, flex: 1, overflowY: "auto", p: 1.75 }}>
                  <Box>
                    <Typography variant="caption" sx={{ display: "block", mb: 0.75, fontWeight: 600, color: "text.secondary" }}>
                      Atalhos rápidos
                    </Typography>
                    <TeamsShortcutChips onPick={(fill) => setNewDraft(fill)} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ display: "block", mb: 0.75, fontWeight: 600, color: "text.secondary" }}>
                      Agente responsável
                    </Typography>
                    <Select
                      value={newAgentId}
                      onChange={(e) => setNewAgentId(e.target.value)}
                      displayEmpty
                      size="small"
                      fullWidth
                    >
                      <MenuItem value="">Agente padrão do workspace</MenuItem>
                      {agents.map((agent) => (
                        <MenuItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </Box>
                  {actionError ? (
                    <Typography variant="caption" color="error.main">
                      {actionError}
                    </Typography>
                  ) : null}
                </Stack>
                <TeamsComposer
                  value={newDraft}
                  onChange={setNewDraft}
                  onSend={handleCreateConversation}
                  sending={sending}
                  placeholder="Descreva sua solicitação…"
                  dense
                  autoFocus
                />
              </Box>
            ) : view.kind === "chat" ? (
              <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }}>
                <SubHeader
                  onBack={backToList}
                  title={activeTask?.title ?? "Conversa"}
                  subtitle={activeTask ? (activeTask.agentName ?? "Sem agente atribuído") : undefined}
                  right={
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                      {activeTask ? <TeamsStatusBadge status={activeTask.status} /> : null}
                      {activeConversationId ? (
                        <IconButton
                          size="small"
                          component={Link}
                          href={teamsConversationUrl(activeConversationId)}
                          title="Abrir na central de conversas"
                          aria-label="Abrir na central de conversas"
                        >
                          <OpenInNewIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      ) : null}
                    </Stack>
                  }
                />
                <TeamsChatThread
                  messages={messages}
                  dense
                  conversationId={activeConversationId ?? undefined}
                  agentName={activeTask?.agentName}
                />
                {actionError ? (
                  <Box sx={{ borderTop: "1px solid", borderColor: "error.main", bgcolor: "color-mix(in srgb, var(--mui-palette-error-main) 6%, transparent)", px: 1.5, py: 0.75 }}>
                    <Typography variant="caption" color="error.main">
                      {actionError}
                    </Typography>
                  </Box>
                ) : null}
                {replyBlocked ? (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper", px: 1.5, py: 1.25 }}>
                    <Typography variant="caption" color="text.secondary">
                      {activeTask?.status === "CONCLUIDA" ? "Conversa concluída." : "Conversa cancelada."}
                    </Typography>
                    <Stack direction="row" spacing={0.75}>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={resolving}
                        onClick={() => void handleToggleResolution()}
                        title="Reabrir conversa"
                        startIcon={<RestartAltIcon sx={{ fontSize: 14 }} />}
                      >
                        Reabrir
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => setView({ kind: "new" })}>
                        Nova conversa
                      </Button>
                    </Stack>
                  </Box>
                ) : (
                  <TeamsComposer
                    value={draft}
                    onChange={setDraft}
                    onSend={handleSendReply}
                    onAttach={handleAttach}
                    sending={sending}
                    placeholder="Escreva uma mensagem…"
                    dense
                    topSlot={
                      activeTask ? (
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                          {agents.length > 0 ? (
                            <Select
                              value={replyAgentId}
                              onChange={(e) => setReplyAgentId(e.target.value)}
                              displayEmpty
                              size="small"
                              sx={{ flex: 1 }}
                            >
                              <MenuItem value="">{`Para ${activeTask.agentName ?? "o agente responsável"}`}</MenuItem>
                              {agents
                                .filter((agent) => agent.id !== activeTask.agentId)
                                .map((agent) => (
                                  <MenuItem key={agent.id} value={agent.id}>
                                    {`Nova conversa com ${agent.name}`}
                                  </MenuItem>
                                ))}
                            </Select>
                          ) : (
                            <Box sx={{ flex: 1 }} />
                          )}
                          <IconButton
                            size="small"
                            disabled={resolving}
                            onClick={() => void handleToggleResolution()}
                            title="Concluir conversa"
                            aria-label="Concluir conversa"
                          >
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      ) : undefined
                    }
                  />
                )}
              </Box>
            ) : (
              <Box sx={{ display: "flex", minHeight: 0, flex: 1, flexDirection: "column" }}>
                {/* chips de status do kanban */}
                <Box sx={{ display: "flex", flexShrink: 0, gap: 0.75, overflowX: "auto", borderBottom: "1px solid", borderColor: "divider", px: 1.5, py: 1, ...teamsThinScrollbarSx }}>
                  {statusChips.map((chip) => {
                    const active = statusFilter === chip.id;
                    return (
                      <TeamsFilterChip
                        key={chip.id}
                        dense
                        active={active}
                        onClick={() => setStatusFilter(chip.id)}
                      >
                        {chip.id !== "TODAS" ? (
                          <Box component="span" sx={{ width: 6, height: 6, flexShrink: 0, borderRadius: "50%", bgcolor: TEAMS_STATUS_DOT[chip.id as TeamsTaskStatus] }} />
                        ) : null}
                        {`${chip.label} (${chip.total})${chip.unread > 0 ? ` · ${chip.unread}` : ""}`}
                      </TeamsFilterChip>
                    );
                  })}
                </Box>

                {/* lista de conversas */}
                <Box sx={{ minHeight: 0, flex: 1, overflowY: "auto" }}>
                  {visibleTasks.length === 0 ? (
                    <TeamsEmptyState
                      icon={<ChatBubbleOutlineRoundedIcon sx={{ fontSize: 20 }} />}
                      title={tasks.length === 0 ? "Nenhuma conversa ainda" : "Nada neste status"}
                      description={
                        tasks.length === 0
                          ? "Crie a primeira conversa — os agentes assumem daí."
                          : "Escolha outro status ou crie uma nova conversa."
                      }
                      action={
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<AddCommentIcon sx={{ fontSize: 16 }} />}
                          onClick={() => setView({ kind: "new" })}
                        >
                          Nova conversa
                        </Button>
                      }
                    />
                  ) : (
                    visibleTasks.map((task) => (
                      <WidgetListItem key={task.id} task={task} onOpen={() => openConversation(task.id)} />
                    ))
                  )}
                </Box>

                {/* rodapé */}
                <Box sx={{ display: "flex", flexShrink: 0, alignItems: "center", justifyContent: "space-between", gap: 1, borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper", px: 1.5, py: 1 }}>
                  <Button
                    component={Link}
                    href={TEAMS_CONVERSAS_ROUTE}
                    size="small"
                    startIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                    sx={FOOTER_BUTTON_SX}
                  >
                    Abrir central de conversas
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddCommentIcon sx={{ fontSize: 14 }} />}
                    onClick={() => setView({ kind: "new" })}
                    sx={FOOTER_BUTTON_SX}
                  >
                    Nova conversa
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      ) : null}

      {/* -------- botão flutuante (clique abre/fecha; arrasto reposiciona) -------- */}
      <Fab
        color="primary"
        // 48px com ícone de 20px — `size-12` do veicular (o padrão MUI é 56px).
        size="medium"
        onClick={toggleExpanded}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        aria-label={expanded ? "Fechar chat de suporte" : "Abrir chat de suporte"}
        title="Clique para abrir · arraste para reposicionar"
        sx={{ position: "relative", touchAction: "none" }}
      >
        {expanded ? (
          <CloseIcon sx={{ fontSize: 20 }} />
        ) : (
          <SmartToyRoundedIcon sx={{ fontSize: 26 }} />
        )}
        {!expanded && totalUnread > 0 ? (
          <Box
            component="span"
            aria-label={`${totalUnread} mensagens novas`}
            sx={{
              position: "absolute",
              top: -6,
              right: -6,
              display: "flex",
              height: 20,
              minWidth: 20,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "999px",
              bgcolor: "error.main",
              color: "#fff",
              px: 0.5,
              fontSize: 10,
              fontWeight: 700,
              boxShadow: "0 0 0 2px var(--mui-palette-background-default)",
            }}
          >
            {totalUnread > 99 ? "99+" : totalUnread}
          </Box>
        ) : null}
      </Fab>
    </Box>
    </ClickAwayListener>
  );
}

function SubHeader({
  onBack,
  title,
  subtitle,
  right,
}: {
  onBack: () => void;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", flexShrink: 0, alignItems: "center", justifyContent: "space-between", gap: 1, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper", px: 1.25, py: 1 }}>
      <Box sx={{ display: "flex", minWidth: 0, alignItems: "center", gap: 0.75 }}>
        <IconButton
          onClick={onBack}
          aria-label="Voltar"
          sx={{ width: 28, height: 28, borderRadius: "6px" }}
        >
          <ArrowBackIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, lineHeight: 1.25 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
              <PersonOutlineIcon sx={{ fontSize: 10, flexShrink: 0, color: "text.secondary" }} />
              <Typography noWrap color="text.secondary" sx={{ fontSize: 10, lineHeight: 1.4 }}>
                {subtitle}
              </Typography>
            </Box>
          ) : null}
        </Box>
      </Box>
      {right}
    </Box>
  );
}

function WidgetListItem({ task, onOpen }: { task: TeamsTaskRecord; onOpen: () => void }) {
  const lastAt = task.lastMessage?.createdAt ?? task.updatedAt;
  const preview = task.lastMessage
    ? `${isUserAuthor(task.lastMessage.authorType) ? "Você: " : ""}${task.lastMessage.content}`
    : "Sem mensagens";
  const waitingUser = (task.status === "AGUARDANDO_USUARIO" || task.hasPendingMessage) && !isFinishedStatus(task.status);

  return (
    <Box
      component="button"
      type="button"
      onClick={onOpen}
      sx={{
        display: "flex",
        width: "100%",
        alignItems: "flex-start",
        gap: 1,
        border: "none",
        borderBottom: "1px solid",
        borderBottomColor: "divider",
        bgcolor: "transparent",
        px: 1.5,
        py: 1.25,
        textAlign: "left",
        cursor: "pointer",
        font: "inherit",
        color: "inherit",
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Box component="span" sx={{ mt: 0.75, width: 8, height: 8, flexShrink: 0, borderRadius: "50%", bgcolor: TEAMS_STATUS_DOT[task.status] }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography noWrap sx={{ fontSize: 13, lineHeight: 1.4, fontWeight: task.unreadCount > 0 ? 600 : 500 }}>
            {task.title}
          </Typography>
          <Typography sx={{ flexShrink: 0, fontSize: 9, color: "text.secondary" }}>
            {formatListTime(lastAt)}
          </Typography>
        </Box>
        <Box sx={{ mt: 0.25, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography noWrap sx={{ fontSize: 11, lineHeight: 1.4, color: task.unreadCount > 0 ? "text.primary" : "text.secondary" }}>
            {preview}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", flexShrink: 0 }}>
            {waitingUser ? (
              <Chip size="small" color="warning" label="Sua vez" sx={{ height: 16, "& .MuiChip-label": { fontSize: 8, px: 0.5 } }} />
            ) : null}
            <TeamsUnreadBadge count={task.unreadCount} />
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

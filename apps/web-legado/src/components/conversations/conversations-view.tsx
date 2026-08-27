"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import {
  Alert,
  Box,
  Drawer,
  Snackbar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AssignConversationDialog from "./assign-conversation-dialog";
import ConversationContextPanel from "./conversation-context-panel";
import ConversationList from "./conversation-list";
import ConversationSidebar, {
  INITIAL_CONVERSATION_FILTERS,
  type ConversationFiltersState,
} from "./conversation-sidebar";
import ConversationThread, {
  type ThreadFeedback,
} from "./conversation-thread";
import CreateConversationDialog from "./create-conversation-dialog";
import CreateWhatsappGroupDialog from "./create-whatsapp-group-dialog";
import AddGroupParticipantsDialog from "./add-group-participants-dialog";
import { conversationDisplayName } from "./conversation-utils";
import {
  CollapsedRail,
  RAIL_WIDTH,
  ResizeHandle,
  usePersistedBoolean,
  useResizablePanel,
} from "./resizable-panel";
import { useConversationEvents } from "@/hooks/conversations/use-conversation-events";
import {
  useMarkConversationReadMutation,
  useUpdateConversationAssigneeMutation,
} from "@/hooks/conversations/use-conversation-mutations";
import { useConversationsQuery } from "@/hooks/conversations/use-conversations";
import type {
  ConversationDto,
  ConversationsQueryParams,
} from "@/types/api/conversation";

const SCOPE_TITLES: Record<ConversationFiltersState["scope"], string> = {
  all: "Todas as conversas",
  mine: "Minhas conversas",
  unassigned: "Não atribuídas",
};

export default function ConversationsView() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const isLgUp = useMediaQuery(theme.breakpoints.up("lg"));
  const searchParams = useSearchParams();
  const deepLinkConversationId = searchParams.get("c")?.trim() || null;

  const [filters, setFilters] = useState<ConversationFiltersState>(
    INITIAL_CONVERSATION_FILTERS,
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    deepLinkConversationId,
  );
  const [mobileShowThread, setMobileShowThread] = useState(
    Boolean(deepLinkConversationId),
  );
  const [contextOpen, setContextOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [addParticipantsOpen, setAddParticipantsOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [feedback, setFeedback] = useState<ThreadFeedback | null>(null);

  // SSE org-scoped; quando desconectado, as queries abaixo fazem polling.
  const { connected } = useConversationEvents();

  // Colunas redimensionáveis/recolhíveis (desktop) — largura e estado
  // persistidos em localStorage, por coluna.
  const listPanel = useResizablePanel({
    storageKey: "list",
    defaultWidth: 660,
    minWidth: 480,
    maxWidth: 920,
  });
  const contextPanel = useResizablePanel({
    storageKey: "context",
    defaultWidth: 380,
    minWidth: 300,
    maxWidth: 560,
  });
  const [threadCollapsed, setThreadCollapsed] = usePersistedBoolean(
    "thread:collapsed",
    false,
  );

  const queryParams: ConversationsQueryParams = useMemo(
    () => ({
      search: filters.search || undefined,
      status: filters.status === "all" ? undefined : filters.status,
      scope: filters.scope,
      filter: filters.unreadOnly ? "unread" : "all",
    }),
    [filters],
  );

  const conversationsQuery = useConversationsQuery(queryParams, {
    refetchInterval: connected ? false : 4000,
  });
  const conversations = useMemo(
    () => conversationsQuery.data ?? [],
    [conversationsQuery.data],
  );

  const resolvedSelectedId = useMemo(() => {
    const preferred = selectedId ?? deepLinkConversationId;
    if (
      preferred &&
      conversations.some((conversation) => conversation.id === preferred)
    ) {
      return preferred;
    }
    if (isMdUp && conversations.length > 0) {
      return conversations[0].id;
    }
    return null;
  }, [selectedId, deepLinkConversationId, isMdUp, conversations]);

  const selected =
    conversations.find((conversation) => conversation.id === resolvedSelectedId) ??
    null;

  const markReadMutation = useMarkConversationReadMutation();
  const markReadRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selected || selected.unreadCount === 0) return;
    const key = `${selected.id}:${selected.unreadCount}`;
    if (markReadRef.current === key) return;
    markReadRef.current = key;
    markReadMutation.mutate(selected.id);
  }, [selected, markReadMutation]);

  const assigneeMutation = useUpdateConversationAssigneeMutation();

  const handleSelect = (conversation: ConversationDto) => {
    setSelectedId(conversation.id);
    setMobileShowThread(true);
  };

  const handleCreated = (conversation: ConversationDto) => {
    setCreateOpen(false);
    setSelectedId(conversation.id);
    setMobileShowThread(true);
    setFeedback({
      message: `Conversa com ${conversationDisplayName(conversation)} aberta`,
      severity: "success",
    });
  };

  const handleAssign = (assigneeMembershipId: string | null) => {
    if (!selected) return;
    assigneeMutation.mutate(
      { conversationId: selected.id, assigneeMembershipId },
      {
        onSuccess: () => {
          setAssignOpen(false);
          setFeedback({
            message: assigneeMembershipId
              ? "Conversa atribuída"
              : "Atribuição removida",
            severity: "success",
          });
        },
        onError: () => {
          setFeedback({
            message: "Não foi possível atribuir a conversa",
            severity: "error",
          });
        },
      },
    );
  };

  const showList = isMdUp || !mobileShowThread;
  const showThread = isMdUp || mobileShowThread;
  const showContextInline = isLgUp;

  return (
    <>
      <Box
        sx={{
          height: "calc(100dvh - var(--shell-chrome-height, 64px))",
          maxHeight: "calc(100dvh - var(--shell-chrome-height, 64px))",
          boxSizing: "border-box",
          pt: 1.5,
          pl: 1.5,
          display: "flex",
          overflow: "hidden",
          bgcolor: "background.default",
        }}
      >
        <Box
          sx={{
            display: showList ? "flex" : "none",
            width: isMdUp ? (listPanel.collapsed ? RAIL_WIDTH : listPanel.width) : "100%",
            flexShrink: 0,
            minHeight: 0,
            height: "100%",
            overflow: "hidden",
          }}
        >
          {isMdUp && listPanel.collapsed ? (
            <CollapsedRail
              label="Inbox"
              icon={<InboxOutlinedIcon fontSize="small" />}
              onExpand={listPanel.expand}
              expandDirection="right"
            />
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "152px minmax(0, 1fr)",
                  sm: "200px minmax(0, 1fr)",
                  md: "220px minmax(0, 1fr)",
                },
                minWidth: 0,
                minHeight: 0,
                height: "100%",
                width: "100%",
                overflow: "hidden",
              }}
            >
              <ConversationSidebar filters={filters} onFiltersChange={setFilters} />
              <ConversationList
                conversations={conversations}
                loading={conversationsQuery.isLoading}
                selectedId={resolvedSelectedId}
                title={SCOPE_TITLES[filters.scope]}
                search={filters.search}
                onSearchChange={(value) =>
                  setFilters((current) => ({ ...current, search: value }))
                }
                onSelect={handleSelect}
                onCreateNew={() => setCreateOpen(true)}
                onCreateGroup={() => setCreateGroupOpen(true)}
              />
            </Box>
          )}
        </Box>

        {isMdUp && showList ? (
          <ResizeHandle
            side="left"
            ariaLabel="coluna Inbox"
            width={listPanel.width}
            minWidth={listPanel.minWidth}
            maxWidth={listPanel.maxWidth}
            onResize={listPanel.setWidth}
            collapsed={listPanel.collapsed}
            onToggleCollapse={listPanel.toggleCollapsed}
          />
        ) : null}

        <Box
          sx={{
            display: showThread ? "flex" : "none",
            flex: isMdUp && threadCollapsed ? "0 0 auto" : "1 1 0%",
            minWidth: 0,
            minHeight: 0,
            height: "100%",
          }}
        >
          {isMdUp && threadCollapsed ? (
            <CollapsedRail
              label="Mensagens"
              icon={<ChatOutlinedIcon fontSize="small" />}
              onExpand={() => setThreadCollapsed(false)}
              expandDirection="right"
            />
          ) : (
            <Box sx={{ width: "100%", minWidth: 0, height: "100%" }}>
              <ConversationThread
                conversation={selected}
                realtimeConnected={connected}
                showBackButton={!isMdUp}
                showContextButton={!showContextInline}
                showCollapseButton={isMdUp}
                onBack={() => setMobileShowThread(false)}
                onOpenContext={() => setContextOpen(true)}
                onOpenAssign={() => setAssignOpen(true)}
                onCollapse={() => setThreadCollapsed(true)}
                onCleared={() => {
                  setSelectedId(null);
                  setMobileShowThread(false);
                }}
                onFeedback={setFeedback}
              />
            </Box>
          )}
        </Box>

        {showContextInline ? (
          <>
            <ResizeHandle
              side="right"
              ariaLabel="coluna Detalhes do contato"
              width={contextPanel.width}
              minWidth={contextPanel.minWidth}
              maxWidth={contextPanel.maxWidth}
              onResize={contextPanel.setWidth}
              collapsed={contextPanel.collapsed}
              onToggleCollapse={contextPanel.toggleCollapsed}
            />
            <Box
              sx={{
                width: contextPanel.collapsed ? RAIL_WIDTH : contextPanel.width,
                flexShrink: 0,
                minHeight: 0,
                height: "100%",
                overflow: "hidden",
              }}
            >
              {contextPanel.collapsed ? (
                <CollapsedRail
                  label="Detalhes"
                  icon={<PersonOutlineOutlinedIcon fontSize="small" />}
                  onExpand={contextPanel.expand}
                  expandDirection="left"
                />
              ) : (
                <ConversationContextPanel
                  conversation={selected}
                  onOpenAssign={() => setAssignOpen(true)}
                  onOpenAddParticipants={
                    selected?.chatType === "group"
                      ? () => setAddParticipantsOpen(true)
                      : undefined
                  }
                  onFeedback={setFeedback}
                />
              )}
            </Box>
          </>
        ) : null}
      </Box>

      <Drawer
        anchor="right"
        open={!showContextInline && contextOpen}
        onClose={() => setContextOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: 380 },
              borderRadius: 0,
            },
          },
        }}
      >
        <ConversationContextPanel
          conversation={selected}
          onOpenAssign={() => {
            setContextOpen(false);
            setAssignOpen(true);
          }}
          onOpenAddParticipants={
            selected?.chatType === "group"
              ? () => {
                  setContextOpen(false);
                  setAddParticipantsOpen(true);
                }
              : undefined
          }
          onFeedback={setFeedback}
        />
      </Drawer>

      <CreateConversationDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      <CreateWhatsappGroupDialog
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onCreated={(conversation, meta) => {
          setCreateGroupOpen(false);
          handleCreated(conversation);
          const parts = ["Grupo criado no WhatsApp"];
          if (!meta?.warning && meta?.inviteLink) {
            parts.push("Link de convite enviado aos participantes por mensagem.");
          }
          if (meta?.warning) parts.push(meta.warning);
          if (meta?.inviteLink) parts.push(`Link: ${meta.inviteLink}`);
          setFeedback({
            message: parts.join(" "),
            severity: meta?.warning ? "warning" : "success",
          });
        }}
      />

      <AddGroupParticipantsDialog
        open={addParticipantsOpen}
        conversationId={selected?.id ?? null}
        groupName={selected ? conversationDisplayName(selected) : ""}
        onClose={() => setAddParticipantsOpen(false)}
        onDone={(message, severity = "success") => {
          setFeedback({ message, severity });
        }}
      />

      <AssignConversationDialog
        open={assignOpen}
        currentAssigneeMembershipId={selected?.assigneeMembershipId ?? null}
        contactName={selected ? conversationDisplayName(selected) : ""}
        submitting={assigneeMutation.isPending}
        onClose={() => setAssignOpen(false)}
        onConfirm={handleAssign}
      />

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={3200}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {feedback ? (
          <Alert
            severity={feedback.severity}
            variant="filled"
            onClose={() => setFeedback(null)}
            sx={{ borderRadius: "8px" }}
          >
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}

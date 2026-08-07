"use client";

import { useState } from "react";
import AddBusinessRoundedIcon from "@mui/icons-material/AddBusinessRounded";
import AddCommentOutlinedIcon from "@mui/icons-material/AddCommentOutlined";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import CachedOutlinedIcon from "@mui/icons-material/CachedOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import ChecklistOutlinedIcon from "@mui/icons-material/ChecklistOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import NextLink from "next/link";
import { Can } from "@/components/permissions/can";
import { useAuth } from "@/components/auth/auth-context";
import {
  useCreateCustomerFromConversationMutation,
  useGroupParticipantsQuery,
  useRefreshConversationAvatarMutation,
  type GroupParticipantDto,
} from "@/hooks/conversations/use-conversation-mutations";
import { useAddCustomerActivityMutation } from "@/hooks/customers/use-add-customer-activity";
import { useCreateCustomerMutation } from "@/hooks/customers/use-create-customer";
import { useCustomerQuery } from "@/hooks/customers/use-customer";
import { useMembersQuery } from "@/hooks/memberships/use-members";
import { useCanPermission } from "@/hooks/permissions/use-ability";
import { useCreateTaskMutation } from "@/hooks/tasks/use-tasks";
import { ApiError } from "@/lib/api/api-error";
import CreateTaskDialog, {
  type CreateTaskPayload,
} from "@/components/tasks/create-task-dialog";
import { useCreateDealMutation } from "@/hooks/deals/use-deals";
import type { ThreadFeedback } from "./conversation-thread";
import RegisterCustomerActivityDialog from "./register-customer-activity-dialog";
import {
  CreateDealDialog,
  type CreateDealFromConversationPayload,
} from "./convert-actions-dialogs";
import type { ConversationContact } from "./conversations-data";
import {
  conversationDisplayName,
  formatPhoneDisplay,
  formatRelativeTime,
  getInitials,
  thinScrollSx,
} from "./conversation-utils";
import type { ConversationDto } from "@/types/api/conversation";
import { CONVERSATION_STATUS_LABELS } from "@/types/api/conversation";

function localInputToIso(localValue: string) {
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

type ConversationContextPanelProps = {
  conversation: ConversationDto | null;
  onOpenAssign: () => void;
  /** Só grupos: abre o diálogo de adicionar participantes. */
  onOpenAddParticipants?: () => void;
  onFeedback?: (feedback: ThreadFeedback) => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      direction="row"
      sx={{ justifyContent: "space-between", gap: 2, py: 0.6 }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, textAlign: "right", minWidth: 0 }}
        noWrap
      >
        {value}
      </Typography>
    </Stack>
  );
}

export default function ConversationContextPanel({
  conversation,
  onOpenAssign,
  onOpenAddParticipants,
  onFeedback,
}: ConversationContextPanelProps) {
  const [copied, setCopied] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [dealOpen, setDealOpen] = useState(false);
  const [proposalsMenuAnchor, setProposalsMenuAnchor] =
    useState<HTMLElement | null>(null);
  const { membership, user } = useAuth();
  const membersQuery = useMembersQuery({ enabled: Boolean(conversation) });
  const customerQuery = useCustomerQuery(conversation?.customerId ?? "");
  const refreshAvatarMutation = useRefreshConversationAvatarMutation();
  const createCustomerMutation = useCreateCustomerFromConversationMutation();
  const addActivityMutation = useAddCustomerActivityMutation(
    conversation?.customerId ?? "",
  );
  const createTaskMutation = useCreateTaskMutation();
  const createDealMutation = useCreateDealMutation();
  const canViewProposals = useCanPermission("proposals.view");
  const canCreateProposals = useCanPermission("proposals.create");
  const canCreateDeals = useCanPermission("deals.create");

  if (!conversation) {
    return (
      <Box
        sx={{
          height: "100%",
          borderLeft: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          display: "grid",
          placeItems: "center",
          px: 2,
          overflow: "hidden",
          borderTopLeftRadius: "8px",
          borderTopRightRadius: "8px",
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          Selecione uma conversa para ver o contexto
        </Typography>
      </Box>
    );
  }

  const name = conversationDisplayName(conversation);
  const isGroup = conversation.chatType === "group";
  const phoneLabel = formatPhoneDisplay(conversation.contactPhone);
  const identityLabel = isGroup ? "Grupo no WhatsApp" : phoneLabel;
  const assignee = (membersQuery.data ?? []).find(
    (member) => member.id === conversation.assigneeMembershipId,
  );
  const assigneeLabel = assignee
    ? assignee.id === membership?.id
      ? `${assignee.user.name} (você)`
      : assignee.user.name
    : "Sem responsável";
  const customer = conversation.customerId ? customerQuery.data : undefined;

  const handleCopyPhone = async () => {
    if (isGroup) return;
    try {
      await navigator.clipboard.writeText(conversation.contactPhone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleRefreshAvatar = () => {
    if (refreshAvatarMutation.isPending) return;
    refreshAvatarMutation.mutate(conversation.id, {
      onSuccess: () =>
        onFeedback?.({
          message: "Foto do WhatsApp atualizada",
          severity: "success",
        }),
      onError: (error) =>
        onFeedback?.({
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível atualizar a foto",
          severity: "error",
        }),
    });
  };

  const handleCreateCustomer = () => {
    if (createCustomerMutation.isPending) return;
    createCustomerMutation.mutate(conversation.id, {
      onSuccess: () =>
        onFeedback?.({
          message: `Cliente "${name}" criado e vinculado à conversa`,
          severity: "success",
        }),
      onError: (error) =>
        onFeedback?.({
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível criar o cliente",
          severity: "error",
        }),
    });
  };

  const customerLabel =
    customer?.name ?? conversation.customerName ?? name;

  const conversationContact: ConversationContact = {
    id: conversation.id,
    nome: name,
    customer: customerLabel,
    telefone: conversation.contactPhone,
  };

  const handleSaveActivity = (text: string) => {
    if (!conversation.customerId) return;
    addActivityMutation.mutate(text, {
      onSuccess: () => {
        setActivityOpen(false);
        onFeedback?.({
          message: "Atividade registrada",
          severity: "success",
        });
      },
      onError: (error) => {
        onFeedback?.({
          message:
            error instanceof ApiError
              ? error.message
              : "Não foi possível registrar a atividade",
          severity: "error",
        });
      },
    });
  };

  const handleCreateTask = (payload: CreateTaskPayload) => {
    createTaskMutation.mutate(
      {
        title: payload.titulo,
        type: payload.tipo,
        dueAt: localInputToIso(payload.dueLocal),
        priority: payload.prioridade,
        subjectType: payload.subjectId ? "deal" : null,
        subjectId: payload.subjectId,
        assigneeUserId: payload.assigneeUserId,
      },
      {
        onSuccess: () => {
          setTaskOpen(false);
          onFeedback?.({
            message: "Tarefa criada",
            severity: "success",
          });
        },
        onError: (error) => {
          onFeedback?.({
            message:
              error instanceof ApiError
                ? error.message
                : "Não foi possível criar a tarefa",
            severity: "error",
          });
        },
      },
    );
  };

  const handleCreateDeal = (payload: CreateDealFromConversationPayload) => {
    if (!conversation.customerId || !user?.id) return;
    createDealMutation.mutate(
      {
        pipelineId: payload.pipelineId,
        stageId: payload.stageId,
        customerId: conversation.customerId,
        title: payload.title,
        valueCents: payload.valueCents,
        ownerUserId: user.id,
      },
      {
        onSuccess: () => {
          setDealOpen(false);
          onFeedback?.({ message: "Negócio criado", severity: "success" });
        },
        onError: (error) => {
          onFeedback?.({
            message:
              error instanceof ApiError
                ? error.message
                : "Não foi possível criar o negócio",
            severity: "error",
          });
        },
      },
    );
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        overflow: "hidden",
        bgcolor: "background.paper",
        borderTopLeftRadius: "8px",
        borderTopRightRadius: "8px",
      }}
    >
      <Box sx={{ ...thinScrollSx, flex: 1, minHeight: 0, p: 2.5 }}>
        <Stack spacing={1.5} sx={{ pb: 0.5 }}>
          <Stack
            spacing={1.25}
            sx={{
              alignItems: "center",
              textAlign: "center",
              px: 2,
              py: 2.25,
              bgcolor: "background.default",
              borderRadius: "8px",
            }}
          >
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={conversation.avatarUrl ?? undefined}
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: "primary.main",
                  fontSize: 26,
                  fontWeight: 700,
                }}
              >
                {getInitials(name)}
              </Avatar>
              <Tooltip title="Atualizar foto do WhatsApp">
                <IconButton
                  size="small"
                  aria-label="Atualizar foto do WhatsApp"
                  onClick={handleRefreshAvatar}
                  disabled={refreshAvatarMutation.isPending}
                  sx={{
                    position: "absolute",
                    right: -6,
                    bottom: -6,
                    width: 28,
                    height: 28,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: 1,
                    "&:hover": { bgcolor: "action.hover" },
                    "@keyframes avatar-refresh-spin": {
                      from: { transform: "rotate(0deg)" },
                      to: { transform: "rotate(360deg)" },
                    },
                  }}
                >
                  <CachedOutlinedIcon
                    sx={{
                      fontSize: 16,
                      animation: refreshAvatarMutation.isPending
                        ? "avatar-refresh-spin 1s linear infinite"
                        : "none",
                    }}
                  />
                </IconButton>
              </Tooltip>
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {name}
              </Typography>
              <Stack
                direction="row"
                spacing={0.5}
                sx={{ alignItems: "center", justifyContent: "center", mt: 0.5 }}
              >
                {isGroup ? (
                  <GroupsOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                ) : (
                  <PhoneOutlinedIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                )}
                <Typography variant="body2" color="text.secondary" noWrap>
                  {identityLabel}
                </Typography>
                {!isGroup ? (
                  <IconButton
                    size="small"
                    aria-label="Copiar telefone"
                    onClick={handleCopyPhone}
                  >
                    <ContentCopyOutlinedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                ) : null}
              </Stack>
              {copied ? (
                <Typography variant="caption" color="primary.main">
                  Telefone copiado
                </Typography>
              ) : null}
            </Box>

            <Stack direction="row" spacing={1}>
              <Chip
                size="small"
                icon={<WhatsAppIcon sx={{ fontSize: "14px !important" }} />}
                label="WhatsApp"
                variant="outlined"
              />
              {isGroup ? (
                <Chip size="small" label="Grupo" variant="outlined" />
              ) : null}
              <Chip
                size="small"
                color={
                  conversation.status === "open"
                    ? "success"
                    : conversation.status === "pending"
                      ? "warning"
                      : "default"
                }
                variant={conversation.status === "closed" ? "outlined" : "filled"}
                label={CONVERSATION_STATUS_LABELS[conversation.status]}
                sx={{ fontWeight: 600 }}
              />
            </Stack>
          </Stack>

          <Box>
            <Accordion
              defaultExpanded
              disableGutters
              elevation={0}
              sx={{ bgcolor: "transparent", "&::before": { display: "none" } }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreRoundedIcon />}
                sx={{ px: 0, minHeight: 44 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Sobre
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                <DetailRow label="Nome" value={name} />
                <DetailRow
                  label={isGroup ? "Tipo" : "Telefone"}
                  value={isGroup ? "Grupo" : phoneLabel}
                />
                <DetailRow label="Responsável" value={assigneeLabel} />
                <DetailRow
                  label="Última mensagem"
                  value={
                    conversation.lastMessageAt
                      ? formatRelativeTime(conversation.lastMessageAt)
                      : "—"
                  }
                />
              </AccordionDetails>
            </Accordion>

            <Accordion
              defaultExpanded
              disableGutters
              elevation={0}
              sx={{
                bgcolor: "transparent",
                borderTop: "1px solid",
                borderColor: "divider",
                "&::before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreRoundedIcon />}
                sx={{ px: 0, minHeight: 44 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Cliente
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                {isGroup ? (
                  <Typography variant="body2" color="text.secondary">
                    Grupos não podem ser vinculados a um cliente.
                  </Typography>
                ) : conversation.customerId ? (
                  <Stack spacing={1.25}>
                    <Box
                      component={NextLink}
                      href={`/clientes/${conversation.customerId}`}
                      sx={{
                        display: "block",
                        p: 1.25,
                        borderRadius: "10px",
                        border: "1px solid",
                        borderColor: "divider",
                        textDecoration: "none",
                        color: "inherit",
                        "&:hover": {
                          borderColor: "primary.main",
                          bgcolor:
                            "color-mix(in srgb, var(--mui-palette-primary-main) 6%, transparent)",
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <BusinessCenterOutlinedIcon fontSize="small" color="action" />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                            {customerLabel}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {customer?.segment
                              ? customer.segment
                              : "Abrir ficha do cliente"}
                          </Typography>
                        </Box>
                        <OpenInNewOutlinedIcon
                          sx={{ fontSize: 16, color: "text.secondary" }}
                        />
                      </Stack>
                    </Box>

                    <Can permission="companies.edit">
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        color="secondary"
                        startIcon={<AddCommentOutlinedIcon />}
                        onClick={() => setActivityOpen(true)}
                      >
                        Registrar atividade
                      </Button>
                    </Can>

                    <Can permission="tasks.create">
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        color="secondary"
                        startIcon={<AddTaskOutlinedIcon />}
                        onClick={() => setTaskOpen(true)}
                      >
                        Nova tarefa
                      </Button>
                    </Can>

                    {canCreateDeals ? (
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        color="secondary"
                        startIcon={<AddBusinessRoundedIcon />}
                        onClick={() => setDealOpen(true)}
                      >
                        Criar negócio
                      </Button>
                    ) : null}

                    {canViewProposals || canCreateProposals ? (
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        color="secondary"
                        startIcon={<DescriptionOutlinedIcon />}
                        onClick={(event) =>
                          setProposalsMenuAnchor(event.currentTarget)
                        }
                      >
                        Criar / ver proposta
                      </Button>
                    ) : null}
                  </Stack>
                ) : (
                  <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
                    <Typography variant="body2" color="text.secondary">
                      Nenhum cliente vinculado a este contato.
                    </Typography>
                    <Can permission="companies.create">
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        startIcon={<PersonAddAltOutlinedIcon />}
                        onClick={handleCreateCustomer}
                        disabled={createCustomerMutation.isPending}
                      >
                        {createCustomerMutation.isPending
                          ? "Convertendo..."
                          : "Converter em lead"}
                      </Button>
                    </Can>
                  </Stack>
                )}
              </AccordionDetails>
            </Accordion>

            {isGroup ? (
              <Accordion
                defaultExpanded
                disableGutters
                elevation={0}
                sx={{
                  bgcolor: "transparent",
                  borderTop: "1px solid",
                  borderColor: "divider",
                  "&::before": { display: "none" },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreRoundedIcon />}
                  sx={{ px: 0, minHeight: 44 }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Participantes
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 0, pt: 0 }}>
                  <GroupParticipantsSection
                    conversationId={conversation.id}
                    onOpenAddParticipants={onOpenAddParticipants}
                  />
                </AccordionDetails>
              </Accordion>
            ) : null}

            <Accordion
              defaultExpanded
              disableGutters
              elevation={0}
              sx={{
                bgcolor: "transparent",
                borderTop: "1px solid",
                borderColor: "divider",
                "&::before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreRoundedIcon />}
                sx={{ px: 0, minHeight: 44 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Ações
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                <Stack spacing={1}>
                  <Can permission="conversations.assign">
                    <Button
                      fullWidth
                      variant="outlined"
                      color="secondary"
                      startIcon={<PersonAddAltOutlinedIcon />}
                      onClick={onOpenAssign}
                    >
                      Atribuir a colega
                    </Button>
                  </Can>
                </Stack>
              </AccordionDetails>
            </Accordion>

            <Accordion
              defaultExpanded
              disableGutters
              elevation={0}
              sx={{
                bgcolor: "transparent",
                borderTop: "1px solid",
                borderColor: "divider",
                "&::before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreRoundedIcon />}
                sx={{ px: 0, minHeight: 44 }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Atalhos
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                <Stack spacing={1}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    component={NextLink}
                    href="/marketing/transmissoes"
                    startIcon={<CampaignOutlinedIcon />}
                  >
                    Mensagens em massa
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    component={NextLink}
                    href="/clientes"
                    startIcon={<GroupsOutlinedIcon />}
                  >
                    Lista de clientes
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    component={NextLink}
                    href="/tarefas"
                    startIcon={<ChecklistOutlinedIcon />}
                  >
                    Minhas tarefas
                  </Button>
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Stack>
      </Box>

      {conversation.customerId ? (
        <>
          <RegisterCustomerActivityDialog
            open={activityOpen}
            customerName={customerLabel}
            pending={addActivityMutation.isPending}
            onClose={() => setActivityOpen(false)}
            onConfirm={handleSaveActivity}
          />
          <CreateTaskDialog
            open={taskOpen}
            onClose={() => setTaskOpen(false)}
            onConfirm={handleCreateTask}
            customerId={conversation.customerId}
            defaultTitle={`Follow-up: ${customerLabel}`}
          />
          <CreateDealDialog
            open={dealOpen}
            contact={conversationContact}
            onClose={() => setDealOpen(false)}
            onConfirm={handleCreateDeal}
            submitting={createDealMutation.isPending}
          />
          <Menu
            anchorEl={proposalsMenuAnchor}
            open={Boolean(proposalsMenuAnchor)}
            onClose={() => setProposalsMenuAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            slotProps={{
              paper: { sx: { minWidth: 220 } },
            }}
          >
            {canCreateProposals ? (
              <MenuItem
                component={NextLink}
                href={`/propostas/nova?customerId=${conversation.customerId}`}
                onClick={() => setProposalsMenuAnchor(null)}
              >
                Criar proposta
              </MenuItem>
            ) : null}
            {canViewProposals ? (
              <MenuItem
                component={NextLink}
                href={`/clientes/${conversation.customerId}/propostas`}
                onClick={() => setProposalsMenuAnchor(null)}
              >
                Ver propostas
              </MenuItem>
            ) : null}
          </Menu>
        </>
      ) : null}
    </Box>
  );
}

function GroupParticipantsSection({
  conversationId,
  onOpenAddParticipants,
}: {
  conversationId: string;
  onOpenAddParticipants?: () => void;
}) {
  const participantsQuery = useGroupParticipantsQuery(conversationId);
  const createLeadMutation = useCreateCustomerMutation();
  const [creatingJid, setCreatingJid] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  if (participantsQuery.isLoading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 2 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  if (participantsQuery.isError) {
    return (
      <Typography variant="body2" color="error">
        Não foi possível carregar os participantes. Verifique a conexão
        WhatsApp.
      </Typography>
    );
  }

  const participants = participantsQuery.data ?? [];

  const handleCreateLead = (participant: GroupParticipantDto) => {
    if (!participant.phone || createLeadMutation.isPending) return;
    setCreateError(null);
    setCreatingJid(participant.jid);
    const localPhone = toBrazilianLocalPhone(participant.phone);
    const name =
      participant.name?.trim() ||
      `WhatsApp ${formatPhoneDisplay(participant.phone)}`;
    createLeadMutation.mutate(
      {
        name,
        personType: "pf",
        lifecycleStage: "lead",
        phone: localPhone,
        primaryContact: {
          name,
          role: "Contato WhatsApp",
          phone: localPhone,
        },
      },
      {
        onSuccess: () => {
          setCreatingJid(null);
          void participantsQuery.refetch();
        },
        onError: () => {
          setCreatingJid(null);
          setCreateError(
            "Não foi possível cadastrar o lead. Verifique permissões e tente de novo.",
          );
        },
      },
    );
  };

  return (
    <Stack spacing={1.5}>
      {participants.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nenhum participante listado.
        </Typography>
      ) : (
        <List dense disablePadding>
          {participants.map((participant) => {
            const isSelf = Boolean(participant.isSelf);
            const registered = Boolean(participant.customerId) && !isSelf;
            const label = isSelf
              ? participant.selfDisplayName ||
                participant.name ||
                "Você"
              : participant.customerName ||
                participant.name ||
                (participant.phone
                  ? formatPhoneDisplay(participant.phone)
                  : "Participante");
            const secondary =
              participant.phone &&
              (isSelf ||
                registered ||
                Boolean(participant.name) ||
                Boolean(participant.customerName))
                ? formatPhoneDisplay(participant.phone)
                : null;
            const creating = creatingJid === participant.jid;

            return (
              <ListItem
                key={participant.jid}
                disableGutters
                sx={{
                  py: 0.75,
                  alignItems: "flex-start",
                  gap: 0.5,
                }}
              >
                <ListItemAvatar sx={{ minWidth: 40, mt: 0.25 }}>
                  <Avatar
                    src={participant.avatarUrl ?? undefined}
                    sx={{ width: 32, height: 32, fontSize: 12 }}
                  >
                    {getInitials(label)}
                  </Avatar>
                </ListItemAvatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack
                    direction="row"
                    spacing={0.75}
                    sx={{ alignItems: "center", minWidth: 0, flexWrap: "wrap" }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, minWidth: 0 }}
                      noWrap
                    >
                      {label}
                    </Typography>
                    {isSelf ? (
                      <Chip
                        size="small"
                        label="você"
                        color="primary"
                        variant="outlined"
                        sx={{ height: 18, fontSize: 10, flexShrink: 0 }}
                      />
                    ) : null}
                    {participant.isAdmin ? (
                      <Chip
                        size="small"
                        label="Admin"
                        sx={{ height: 18, fontSize: 10, flexShrink: 0 }}
                      />
                    ) : null}
                  </Stack>
                  {secondary ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="div"
                      sx={{ display: "block" }}
                      noWrap
                    >
                      {secondary}
                    </Typography>
                  ) : null}
                  {isSelf ? null : registered && participant.customerId ? (
                    <Button
                      component={NextLink}
                      href={`/clientes/${participant.customerId}`}
                      size="small"
                      variant="outlined"
                      color="secondary"
                      startIcon={<OpenInNewOutlinedIcon sx={{ fontSize: 14 }} />}
                      sx={{ mt: 0.75, display: "inline-flex" }}
                    >
                      Abrir no CRM
                    </Button>
                  ) : participant.phone ? (
                    <Can permission="companies.create">
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        disabled={createLeadMutation.isPending}
                        onClick={() => handleCreateLead(participant)}
                        startIcon={
                          creating ? (
                            <CircularProgress size={12} color="inherit" />
                          ) : (
                            <PersonAddAltOutlinedIcon sx={{ fontSize: 14 }} />
                          )
                        }
                        sx={{ mt: 0.75, display: "inline-flex" }}
                      >
                        {creating ? "Cadastrando…" : "Cadastrar como lead"}
                      </Button>
                    </Can>
                  ) : (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="div"
                      sx={{ display: "block", mt: 0.25 }}
                    >
                      Telefone indisponível no WhatsApp
                    </Typography>
                  )}
                </Box>
              </ListItem>
            );
          })}
        </List>
      )}
      {createError ? (
        <Typography variant="caption" color="error">
          {createError}
        </Typography>
      ) : null}
      {onOpenAddParticipants ? (
        <Can permission="conversations.reply">
          <Button
            fullWidth
            size="small"
            variant="outlined"
            color="secondary"
            startIcon={<GroupsOutlinedIcon />}
            onClick={onOpenAddParticipants}
          >
            Convidar participantes
          </Button>
        </Can>
      ) : null}
    </Stack>
  );
}

/** Telefone BR local (DDD+9+número) para cadastro de lead a partir do WA. */
function toBrazilianLocalPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const local =
    digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
      ? digits.slice(2)
      : digits;
  if (local.length === 10) return `${local.slice(0, 2)}9${local.slice(2)}`;
  if (local.length === 11) return local;
  return digits;
}

"use client";

import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import AddTaskRoundedIcon from "@mui/icons-material/AddTaskRounded";
import CallOutlinedIcon from "@mui/icons-material/CallOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import {
  Autocomplete,
  Box,
  Button,
  ButtonBase,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "@/components/auth/auth-context";
import { dealsQueryKey, useDealsQuery } from "@/hooks/deals/use-deals";
import { useMembersQuery } from "@/hooks/memberships/use-members";
import { usePipelinesQuery } from "@/hooks/pipelines/use-pipelines";
import { httpClient } from "@/lib/api/http-client";
import type { DealItem } from "@/types/api/deal";
import {
  suggestNextDueAt,
  type TaskPriority,
  type TaskType,
} from "./tasks-data";

export type CreateTaskPayload = {
  titulo: string;
  tipo: TaskType;
  dueLocal: string;
  prioridade: TaskPriority;
  subjectId: string | null;
  assigneeUserId: string | null;
};

type CreateTaskDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: CreateTaskPayload) => void;
  /** Pré-seleciona vínculo com negócio (ex.: drawer do deal). */
  defaultSubjectId?: string | null;
  defaultAssigneeUserId?: string | null;
  /** Título inicial (ex.: follow-up a partir de conversa). */
  defaultTitle?: string;
  /** Quando informado, lista só negócios desse cliente. */
  customerId?: string | null;
};

type DuePreset = "hoje" | "amanha" | "3dias" | "especifica";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "transparent",
  },
} as const;

const TIPO_OPTIONS: Array<{
  value: TaskType;
  label: string;
  hint: string;
  icon: typeof CallOutlinedIcon;
}> = [
  {
    value: "ligacao",
    label: "Ligação",
    hint: "Contato rápido por telefone",
    icon: CallOutlinedIcon,
  },
  {
    value: "reuniao",
    label: "Reunião",
    hint: "Encontro ou call agendada",
    icon: GroupsOutlinedIcon,
  },
  {
    value: "follow_up",
    label: "Follow-up",
    hint: "Retomar conversa ou proposta",
    icon: ReplayOutlinedIcon,
  },
];

const PRIORIDADE_OPTIONS: Array<{
  value: TaskPriority;
  label: string;
  hint: string;
  color: string;
}> = [
  {
    value: "alta",
    label: "Alta",
    hint: "Urgente",
    color: "error.main",
  },
  {
    value: "media",
    label: "Média",
    hint: "No prazo",
    color: "warning.main",
  },
  {
    value: "baixa",
    label: "Baixa",
    hint: "Quando der",
    color: "success.main",
  },
];

const DUE_PRESETS: Array<{ value: DuePreset; label: string; days: number }> = [
  { value: "hoje", label: "Hoje", days: 0 },
  { value: "amanha", label: "Amanhã", days: 1 },
  { value: "3dias", label: "Em 3 dias", days: 3 },
  { value: "especifica", label: "Data específica", days: -1 },
];

function toLocalInputValue(iso: string) {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function OptionCard({
  selected,
  onClick,
  children,
  sx,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  sx?: object;
}) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        display: "block",
        width: "100%",
        textAlign: "left",
        p: 1.5,
        borderRadius: "10px",
        border: "1px solid",
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? "action.selected" : "transparent",
        transition: "border-color 0.15s, background-color 0.15s",
        "&:hover": {
          borderColor: selected ? "primary.main" : "text.secondary",
          bgcolor: selected ? "action.selected" : "action.hover",
        },
        ...sx,
      }}
    >
      {children}
    </ButtonBase>
  );
}

export default function CreateTaskDialog({
  open,
  onClose,
  onConfirm,
  defaultSubjectId = null,
  defaultAssigneeUserId = null,
  defaultTitle = "",
  customerId = null,
}: CreateTaskDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      {open ? (
        <CreateTaskDialogBody
          key={`${defaultSubjectId ?? ""}-${customerId ?? ""}-${defaultTitle}-${defaultAssigneeUserId ?? ""}`}
          onClose={onClose}
          onConfirm={onConfirm}
          defaultSubjectId={defaultSubjectId}
          defaultAssigneeUserId={defaultAssigneeUserId}
          defaultTitle={defaultTitle}
          customerId={customerId}
        />
      ) : null}
    </Dialog>
  );
}

function CreateTaskDialogBody({
  onClose,
  onConfirm,
  defaultSubjectId = null,
  defaultAssigneeUserId = null,
  defaultTitle = "",
  customerId = null,
}: Omit<CreateTaskDialogProps, "open">) {
  const { user } = useAuth();
  const { data: members = [] } = useMembersQuery({ enabled: true });
  const { data: pipelines = [] } = usePipelinesQuery({
    enabled: !customerId,
  });
  const customerDealsQuery = useDealsQuery(
    customerId ? { customerId } : undefined,
  );

  const dealQueries = useQueries({
    queries: pipelines.map((pipeline) => ({
      queryKey: dealsQueryKey({ pipelineId: pipeline.id }),
      queryFn: async () => {
        const { data } = await httpClient.get<DealItem[]>("/backend/deals", {
          params: { pipelineId: pipeline.id },
        });
        return data;
      },
      enabled: !customerId && pipelines.length > 0,
    })),
  });

  const deals = useMemo(() => {
    if (customerId) {
      return [...(customerDealsQuery.data ?? [])].sort((a, b) =>
        a.title.localeCompare(b.title, "pt-BR"),
      );
    }
    const byId = new Map<string, DealItem>();
    for (const query of dealQueries) {
      for (const deal of query.data ?? []) {
        byId.set(deal.id, deal);
      }
    }
    return Array.from(byId.values()).sort((a, b) =>
      a.title.localeCompare(b.title, "pt-BR"),
    );
  }, [customerId, customerDealsQuery.data, dealQueries]);

  const activeMembers = useMemo(
    () => members.filter((m) => m.status === "active"),
    [members],
  );

  const [titulo, setTitulo] = useState(defaultTitle);
  const [tipo, setTipo] = useState<TaskType>("ligacao");
  const [subjectIdPick, setSubjectIdPick] = useState<string | null>(
    defaultSubjectId,
  );
  const [assigneeUserId, setAssigneeUserId] = useState<string | null>(
    defaultAssigneeUserId ?? user?.id ?? null,
  );
  const [dueLocal, setDueLocal] = useState(
    toLocalInputValue(suggestNextDueAt(0)),
  );
  const [prioridade, setPrioridade] = useState<TaskPriority>("media");
  const [duePreset, setDuePreset] = useState<DuePreset>("hoje");

  const autoSubjectId = useMemo(() => {
    if (defaultSubjectId || !customerId) return null;
    const openDeals = deals.filter((d) => d.stageType === "open");
    if (openDeals.length === 1) return openDeals[0]!.id;
    return null;
  }, [defaultSubjectId, customerId, deals]);

  const subjectId = autoSubjectId ?? subjectIdPick;

  const canSubmit = titulo.trim().length > 0;

  const handleDuePresetChange = (preset: DuePreset) => {
    setDuePreset(preset);
    if (preset === "especifica") return;
    const days = DUE_PRESETS.find((item) => item.value === preset)?.days ?? 0;
    setDueLocal(toLocalInputValue(suggestNextDueAt(days)));
  };

  const selectedDeal = deals.find((d) => d.id === subjectId) ?? null;
  const tipoHint =
    TIPO_OPTIONS.find((option) => option.value === tipo)?.label ?? "tarefa";

  return (
    <>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              display: "grid",
              placeItems: "center",
              bgcolor:
                "color-mix(in srgb, var(--mui-palette-primary-main) 10%, transparent)",
              color: "primary.main",
              flexShrink: 0,
            }}
          >
            <AddTaskRoundedIcon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
              Nova tarefa
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Defina tipo, prioridade, prazo e responsável
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ borderBottom: 0 }}>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Autocomplete
            options={deals}
            value={selectedDeal}
            onChange={(_, value) => setSubjectIdPick(value?.id ?? null)}
            getOptionLabel={(option) =>
              `${option.title} · ${option.customerName}`
            }
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Negócio (opcional)"
                placeholder="Vincular a um negócio"
                sx={fieldSx}
              />
            )}
          />

          <FormControl fullWidth sx={fieldSx}>
            <InputLabel id="assignee-label">Responsável</InputLabel>
            <Select
              labelId="assignee-label"
              label="Responsável"
              value={assigneeUserId ?? ""}
              onChange={(event) =>
                setAssigneeUserId(event.target.value || null)
              }
            >
              {activeMembers.map((member) => (
                <MenuItem key={member.user.id} value={member.user.id}>
                  {member.user.name}
                  {member.user.id === user?.id ? " (você)" : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <TextField
              label="O que fazer"
              placeholder={`Ex.: ${tipoHint} com o cliente`}
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              required
              fullWidth
              sx={fieldSx}
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(3, minmax(0, 1fr))",
                },
                gap: 1.25,
                mt: 1.75,
              }}
            >
              {TIPO_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = tipo === option.value;
                return (
                  <OptionCard
                    key={option.value}
                    selected={selected}
                    onClick={() => setTipo(option.value)}
                  >
                    <Stack spacing={1}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "10px",
                          display: "grid",
                          placeItems: "center",
                          bgcolor: selected ? "primary.main" : "action.hover",
                          color: selected
                            ? "primary.contrastText"
                            : "text.secondary",
                        }}
                      >
                        <Icon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 700, lineHeight: 1.2 }}
                        >
                          {option.label}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 0.35 }}
                        >
                          {option.hint}
                        </Typography>
                      </Box>
                    </Stack>
                  </OptionCard>
                );
              })}
            </Box>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 1.25,
            }}
          >
            {PRIORIDADE_OPTIONS.map((option) => {
              const selected = prioridade === option.value;
              return (
                <OptionCard
                  key={option.value}
                  selected={selected}
                  onClick={() => setPrioridade(option.value)}
                  sx={{ py: 1.25, px: 1.25 }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center" }}
                  >
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        bgcolor: option.color,
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, lineHeight: 1.2 }}
                      >
                        {option.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                      >
                        {option.hint}
                      </Typography>
                    </Box>
                  </Stack>
                </OptionCard>
              );
            })}
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm:
                  duePreset === "especifica"
                    ? "minmax(0, 1fr) minmax(0, 1fr)"
                    : "1fr",
              },
              gap: 1.5,
              alignItems: "start",
            }}
          >
            <FormControl fullWidth sx={fieldSx}>
              <InputLabel id="due-preset-label">Quando</InputLabel>
              <Select
                labelId="due-preset-label"
                label="Quando"
                value={duePreset}
                onChange={(event) =>
                  handleDuePresetChange(event.target.value as DuePreset)
                }
              >
                {DUE_PRESETS.map((preset) => (
                  <MenuItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {duePreset === "especifica" ? (
              <TextField
                label="Data e hora"
                type="datetime-local"
                value={dueLocal}
                onChange={(event) => setDueLocal(event.target.value)}
                fullWidth
                sx={fieldSx}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            ) : null}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {canSubmit
            ? `${TIPO_OPTIONS.find((o) => o.value === tipo)?.label} · ${PRIORIDADE_OPTIONS.find((o) => o.value === prioridade)?.label}`
            : "Preencha o título"}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} color="secondary">
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!canSubmit}
            onClick={() => {
              onConfirm({
                titulo: titulo.trim(),
                tipo,
                dueLocal,
                prioridade,
                subjectId,
                assigneeUserId,
              });
            }}
          >
            Criar tarefa
          </Button>
        </Stack>
      </DialogActions>
    </>
  );
}

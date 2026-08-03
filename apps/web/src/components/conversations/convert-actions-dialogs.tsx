"use client";

import { useMemo, useState } from "react";
import AddBusinessRoundedIcon from "@mui/icons-material/AddBusinessRounded";
import FlagRoundedIcon from "@mui/icons-material/FlagRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import {
  Box,
  Button,
  Dialog,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import {
  CheckboxCard,
  ConversasDialogActions,
  ConversasDialogContent,
  ConversasDialogHeader,
  conversasDialogPaperSx,
  conversasFieldSx,
  CurrencyTextField,
  FieldLabel,
  OptionRadioCard,
} from "@/components/common/dialog-form-ui";
import { usePipelinesQuery } from "@/hooks/pipelines/use-pipelines";
import type { ConversationContact } from "./conversations-data";

export type CreateDealFromConversationPayload = {
  pipelineId: string;
  stageId: string;
  title: string;
  valueCents: number;
};

export type CreateTaskFromConversationPayload = {
  titulo: string;
  dueLocal: string;
  prioridade: "alta" | "media" | "baixa";
};

type CreateDealDialogProps = {
  open: boolean;
  contact: ConversationContact | null;
  onClose: () => void;
  onConfirm: (payload: CreateDealFromConversationPayload) => void;
  submitting?: boolean;
};

type CreateLeadDialogProps = {
  open: boolean;
  contact: ConversationContact | null;
  alreadyCreated: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

type CreateTaskFromConversationDialogProps = {
  open: boolean;
  contact: ConversationContact | null;
  onClose: () => void;
  onConfirm: (payload: CreateTaskFromConversationPayload) => void;
};

const PRIORIDADE_OPTIONS: Array<{
  value: "alta" | "media" | "baixa";
  label: string;
  description: string;
  tone: "error" | "warning" | "success";
}> = [
  {
    value: "alta",
    label: "Alta",
    description: "Resolver o quanto antes",
    tone: "error",
  },
  {
    value: "media",
    label: "Média",
    description: "Dentro do prazo normal",
    tone: "warning",
  },
  {
    value: "baixa",
    label: "Baixa",
    description: "Pode esperar um pouco",
    tone: "success",
  },
];

type DuePreset = "hoje" | "amanha" | "3dias" | "especifica";

const DUE_PRESETS: Array<{ value: DuePreset; label: string; days: number }> = [
  { value: "hoje", label: "Hoje", days: 0 },
  { value: "amanha", label: "Amanhã", days: 1 },
  { value: "3dias", label: "Em 3 dias", days: 3 },
  { value: "especifica", label: "Data específica", days: -1 },
];

function toLocalInputValue(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dueAtDaysAhead(days: number) {
  const date = new Date();
  date.setHours(10, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return toLocalInputValue(date);
}

export function CreateDealDialog({
  open,
  contact,
  onClose,
  onConfirm,
  submitting = false,
}: CreateDealDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: conversasDialogPaperSx } }}
    >
      {open && contact ? (
        <CreateDealDialogBody
          key={contact.id ?? `${contact.nome}-${contact.customer}`}
          contact={contact}
          onClose={onClose}
          onConfirm={onConfirm}
          submitting={submitting}
        />
      ) : null}
    </Dialog>
  );
}

function CreateDealDialogBody({
  contact,
  onClose,
  onConfirm,
  submitting,
}: Omit<CreateDealDialogProps, "open"> & {
  contact: NonNullable<CreateDealDialogProps["contact"]>;
}) {
  const pipelinesQuery = usePipelinesQuery();
  const activePipelines = useMemo(
    () => (pipelinesQuery.data ?? []).filter((p) => p.status === "active"),
    [pipelinesQuery.data],
  );
  const [pipelineId, setPipelineId] = useState("");
  const [stageId, setStageId] = useState("");
  const [titulo, setTitulo] = useState(`${contact.customer} — Novo negócio`);
  const [valor, setValor] = useState<number | undefined>();

  const selectedPipeline =
    activePipelines.find((p) => p.id === pipelineId) ?? activePipelines[0];
  const openStages = useMemo(
    () =>
      (selectedPipeline?.stages ?? []).filter(
        (stage) => stage.stageType === "open",
      ),
    [selectedPipeline],
  );
  const effectivePipelineId = selectedPipeline?.id ?? "";
  const effectiveStageId =
    stageId && openStages.some((s) => s.id === stageId)
      ? stageId
      : (openStages[0]?.id ?? "");

  const canSubmit =
    titulo.trim().length > 0 &&
    valor != null &&
    valor > 0 &&
    effectivePipelineId.length > 0 &&
    effectiveStageId.length > 0;

  return (
    <>
      <ConversasDialogHeader
        icon={<AddBusinessRoundedIcon />}
        title="Criar negócio"
        description={`Vinculado a ${contact.nome} · ${contact.customer}`}
      />

      <ConversasDialogContent>
        <TextField
          label="Título"
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          required
          fullWidth
          sx={conversasFieldSx}
        />

        <CurrencyTextField
          label="Valor estimado"
          placeholder="R$ 0,00"
          value={valor}
          onValueChange={setValor}
          required
        />

        <FormControl fullWidth sx={conversasFieldSx} disabled={pipelinesQuery.isLoading}>
          <InputLabel id="conversa-deal-pipeline">Funil</InputLabel>
          <Select
            labelId="conversa-deal-pipeline"
            label="Funil"
            value={effectivePipelineId}
            onChange={(event) => {
              setPipelineId(event.target.value);
              setStageId("");
            }}
          >
            {activePipelines.map((pipeline) => (
              <MenuItem key={pipeline.id} value={pipeline.id}>
                {pipeline.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={conversasFieldSx} disabled={!effectivePipelineId}>
          <InputLabel id="conversa-deal-stage">Etapa</InputLabel>
          <Select
            labelId="conversa-deal-stage"
            label="Etapa"
            value={effectiveStageId}
            onChange={(event) => setStageId(event.target.value)}
          >
            {openStages.map((stage) => (
              <MenuItem key={stage.id} value={stage.id}>
                {stage.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </ConversasDialogContent>

      <ConversasDialogActions>
        <Button onClick={onClose} color="secondary" disabled={submitting}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={!canSubmit || submitting}
          onClick={() =>
            onConfirm({
              pipelineId: effectivePipelineId,
              stageId: effectiveStageId,
              title: titulo.trim(),
              valueCents: Math.round((valor ?? 0) * 100),
            })
          }
        >
          {submitting ? "Criando…" : "Criar negócio"}
        </Button>
      </ConversasDialogActions>
    </>
  );
}

export function CreateLeadDialog({
  open,
  contact,
  alreadyCreated,
  onClose,
  onConfirm,
}: CreateLeadDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{ paper: { sx: conversasDialogPaperSx } }}
    >
      {open ? (
        <CreateLeadFromConversationDialogBody
          key={String(open)}
          contact={contact}
          alreadyCreated={alreadyCreated}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      ) : null}
    </Dialog>
  );
}

function CreateLeadFromConversationDialogBody({
  contact,
  alreadyCreated,
  onClose,
  onConfirm,
}: Omit<CreateLeadDialogProps, "open">) {
  const [confirmarDados, setConfirmarDados] = useState(true);
  const [notificarEquipe, setNotificarEquipe] = useState(false);

  return (
    <>
      <ConversasDialogHeader
        icon={<PersonAddAltRoundedIcon />}
        title="Transformar em lead"
        description={
          alreadyCreated
            ? "Esta conversa já foi transformada em lead."
            : contact
              ? `Criar lead para ${contact.nome} (${contact.customer})`
              : "Criar lead a partir desta conversa"
        }
        tone={alreadyCreated ? "success" : "primary"}
      />

      <ConversasDialogContent>
        {alreadyCreated ? (
          <Box
            sx={{
              p: 1.75,
              borderRadius: "12px",
              border: "1px solid",
              borderColor: "success.main",
              bgcolor:
                "color-mix(in srgb, var(--mui-palette-success-main) 8%, transparent)",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Lead já criado
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 0.5 }}
            >
              Você pode continuar o atendimento normalmente nesta conversa.
            </Typography>
          </Box>
        ) : (
          <>
            {contact ? (
              <Box
                sx={{
                  p: 1.75,
                  borderRadius: "12px",
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {contact.nome}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.35 }}
                >
                  {contact.customer}
                  {contact.email ? ` · ${contact.email}` : ""}
                  {contact.telefone ? ` · ${contact.telefone}` : ""}
                </Typography>
              </Box>
            ) : null}

            <CheckboxCard
              checked={confirmarDados}
              onChange={setConfirmarDados}
              title="Confirmar dados do contato"
              description="Usar nome e cliente desta conversa no lead"
            />
            <CheckboxCard
              checked={notificarEquipe}
              onChange={setNotificarEquipe}
              title="Notificar a equipe"
              description="Avisar colegas sobre o novo lead"
            />
          </>
        )}
      </ConversasDialogContent>

      <ConversasDialogActions>
        <Button onClick={onClose} color="secondary">
          {alreadyCreated ? "Fechar" : "Cancelar"}
        </Button>
        {!alreadyCreated ? (
          <Button
            variant="contained"
            disabled={!confirmarDados}
            onClick={onConfirm}
          >
            Criar lead
          </Button>
        ) : null}
      </ConversasDialogActions>
    </>
  );
}

export function CreateTaskFromConversationDialog({
  open,
  contact,
  onClose,
  onConfirm,
}: CreateTaskFromConversationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { sx: conversasDialogPaperSx } }}
    >
      {open && contact ? (
        <CreateTaskFromConversationDialogBody
          key={contact.id ?? `${contact.nome}-${contact.customer}`}
          contact={contact}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      ) : null}
    </Dialog>
  );
}

function CreateTaskFromConversationDialogBody({
  contact,
  onClose,
  onConfirm,
}: Omit<CreateTaskFromConversationDialogProps, "open"> & {
  contact: NonNullable<CreateTaskFromConversationDialogProps["contact"]>;
}) {
  const [titulo, setTitulo] = useState(`Follow-up: ${contact.nome}`);
  const [duePreset, setDuePreset] = useState<DuePreset>("hoje");
  const [dueLocal, setDueLocal] = useState(dueAtDaysAhead(0));
  const [prioridade, setPrioridade] = useState<"alta" | "media" | "baixa">(
    "media",
  );
  const [lembrar, setLembrar] = useState(true);

  const handleDuePresetChange = (preset: DuePreset) => {
    setDuePreset(preset);
    if (preset === "especifica") return;
    const days = DUE_PRESETS.find((item) => item.value === preset)?.days ?? 0;
    setDueLocal(dueAtDaysAhead(days));
  };

  const canSubmit = titulo.trim().length > 0 && dueLocal.length > 0;

  return (
    <>
      <ConversasDialogHeader
        icon={<TaskAltRoundedIcon />}
        title="Criar tarefa"
        description={`Vinculada à conversa com ${contact.nome}`}
      />

      <ConversasDialogContent>
        <TextField
          label="O que fazer"
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          required
          fullWidth
          sx={conversasFieldSx}
        />

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
          <FormControl fullWidth sx={conversasFieldSx}>
            <InputLabel id="conversa-task-due-label">Quando</InputLabel>
            <Select
              labelId="conversa-task-due-label"
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
              sx={conversasFieldSx}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          ) : null}
        </Box>

        <Box>
          <FieldLabel>Prioridade</FieldLabel>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, minmax(0, 1fr))",
              },
              gap: 1.25,
            }}
          >
            {PRIORIDADE_OPTIONS.map((option) => {
              const selected = prioridade === option.value;
              return (
                <OptionRadioCard
                  key={option.value}
                  selected={selected}
                  onClick={() => setPrioridade(option.value)}
                  title={option.label}
                  description={option.description}
                  icon={
                    <FlagRoundedIcon
                      fontSize="small"
                      sx={{
                        color: selected ? "inherit" : `${option.tone}.main`,
                      }}
                    />
                  }
                />
              );
            })}
          </Box>
        </Box>

        <CheckboxCard
          checked={lembrar}
          onChange={setLembrar}
          title="Lembrar no horário"
          description="Receber um aviso quando a tarefa estiver próxima"
        />
      </ConversasDialogContent>

      <ConversasDialogActions>
        <Button onClick={onClose} color="secondary">
          Cancelar
        </Button>
        <Button
          variant="contained"
          disabled={!canSubmit}
          onClick={() =>
            onConfirm({
              titulo: titulo.trim(),
              dueLocal,
              prioridade,
            })
          }
        >
          Criar tarefa
        </Button>
      </ConversasDialogActions>
    </>
  );
}

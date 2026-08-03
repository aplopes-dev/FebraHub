"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import SendIcon from "@mui/icons-material/Send";
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Dialog,
  IconButton,
  Stack,
  TextField,
  Typography,
  type ChipProps,
} from "@mui/material";
import { chatDoodleSx } from "@/components/conversations/chat-doodle";
import {
  formatAttachmentSize,
  isImageAttachment,
  isPdfAttachment,
  teamsAttachmentUrl,
  TEAMS_TASK_STATUS_LABELS,
  type TeamsAttachment,
  type TeamsMessage,
  type TeamsTaskStatus,
} from "@/lib/teams/teams-api";
import { RichText } from "./rich-text";

/**
 * Primitivas visuais compartilhadas do chat da integração Team Aplopes AI.
 * A central de conversas, o widget flutuante e o kanban consomem daqui para o
 * visual ficar idêntico em todas as superfícies.
 */

export const TEAMS_STATUS_VARIANT: Record<TeamsTaskStatus, ChipProps["color"]> = {
  BACKLOG: "default",
  EM_PROGRESSO: "warning",
  BLOQUEADA: "error",
  AGUARDANDO_USUARIO: "warning",
  EM_VALIDACAO: "warning",
  CONCLUIDA: "success",
  CANCELADA: "default",
  ERRO: "error",
};

/** Bolinha de status (sidebar/chips) — mesma semântica de cor dos badges. */
export const TEAMS_STATUS_DOT: Record<TeamsTaskStatus, string> = {
  BACKLOG: "text.disabled",
  EM_PROGRESSO: "primary.main",
  BLOQUEADA: "error.main",
  AGUARDANDO_USUARIO: "warning.main",
  EM_VALIDACAO: "warning.main",
  CONCLUIDA: "success.main",
  CANCELADA: "text.disabled",
  ERRO: "error.main",
};

/** Rótulos curtos para chips (os completos de TEAMS_TASK_STATUS_LABELS estouram o chip). */
export const TEAMS_STATUS_SHORT_LABELS: Record<TeamsTaskStatus, string> = {
  ...TEAMS_TASK_STATUS_LABELS,
  AGUARDANDO_USUARIO: "Aguardando resposta",
};

/** O backend persiste USER/AGENT (enum Prisma); tolera minúsculas por segurança. */
export function isUserAuthor(authorType: string): boolean {
  return authorType.toUpperCase() === "USER";
}

/// Cor determinística POR AGENTE para o nome no balão — num fio com vários
/// agentes (fala de especialista espelhada na origem), cada um fala numa cor.
/// O mesmo agente mantém a mesma cor em qualquer conversa (hash do id/nome).
const AGENT_NAME_COLORS = [
  "primary.main",
  "success.main",
  "secondary.main",
  "warning.dark",
  "error.main",
  "info.dark",
  "primary.dark",
  "success.dark",
];

function agentNameColor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return AGENT_NAME_COLORS[Math.abs(hash) % AGENT_NAME_COLORS.length];
}

export function isFinishedStatus(status: TeamsTaskStatus): boolean {
  return status === "CONCLUIDA" || status === "CANCELADA";
}

const timeFormatter = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const dayLongFormatter = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" });
const dayShortFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function formatMessageTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

/** Rótulo do separador de dia: Hoje / Ontem / "5 de julho". */
export function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return dayLongFormatter.format(date);
}

/** Hora compacta pra lista de conversas: HH:mm hoje, "Ontem", dd/mm/aa. */
export function formatListTime(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
  if (diffDays === 0) return timeFormatter.format(date);
  if (diffDays === 1) return "Ontem";
  return dayShortFormatter.format(date);
}

export function groupMessagesByDay(messages: TeamsMessage[]): Array<{ day: string; messages: TeamsMessage[] }> {
  const groups: Array<{ day: string; messages: TeamsMessage[] }> = [];
  for (const message of messages) {
    const day = formatDayLabel(message.createdAt);
    const current = groups[groups.length - 1];
    if (current && current.day === day) current.messages.push(message);
    else groups.push({ day, messages: [message] });
  }
  return groups;
}

export function TeamsStatusBadge({ status, className }: { status: TeamsTaskStatus; className?: string }) {
  return (
    <Chip
      size="small"
      color={TEAMS_STATUS_VARIANT[status]}
      label={TEAMS_TASK_STATUS_LABELS[status]}
      className={className}
      // Tag do veicular: 22px de altura e 12px de fonte (não o chip padrão de 24px).
      sx={{ height: 22, "& .MuiChip-label": { px: 1, fontSize: 12 } }}
    />
  );
}

/**
 * Barra de filtros com scroll horizontal discreto — paridade com o
 * `[scrollbar-width:thin]` usado nas listas do veicular.
 */
export const teamsThinScrollbarSx = {
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(0,0,0,0.12) transparent",
  "&::-webkit-scrollbar": { height: 6, width: 6 },
  "&::-webkit-scrollbar-thumb": {
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
} as const;

/**
 * Pill de filtro de status (Todas / Backlog / …). Espelha o botão do veicular:
 * contorno leve quando inativo e apenas um tint da primária quando ativo — não
 * o `Chip` preenchido do MUI.
 */
export function TeamsFilterChip({
  active,
  dense,
  onClick,
  title,
  children,
}: {
  active: boolean;
  /** Widget flutuante: 10px e padding menor. Central de conversas: 11px. */
  dense?: boolean;
  onClick: () => void;
  title?: string;
  children: ReactNode;
}) {
  return (
    <ButtonBase
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      sx={{
        display: "flex",
        flexShrink: 0,
        alignItems: "center",
        gap: dense ? 0.5 : 0.75,
        borderRadius: 999,
        border: "1px solid",
        px: dense ? 1 : 1.25,
        py: dense ? 0.25 : 0.5,
        fontSize: dense ? 10 : 11,
        lineHeight: 1.4,
        transition: "background-color 0.2s, color 0.2s, border-color 0.2s",
        ...(active
          ? {
              borderColor:
                "color-mix(in srgb, var(--mui-palette-primary-main) 50%, transparent)",
              bgcolor:
                "color-mix(in srgb, var(--mui-palette-primary-main) 10%, transparent)",
              color: "primary.main",
              fontWeight: 500,
            }
          : {
              borderColor: "divider",
              bgcolor: "background.paper",
              color: "text.secondary",
              "&:hover": { bgcolor: "action.hover", color: "text.primary" },
            }),
      }}
    >
      {children}
    </ButtonBase>
  );
}

export function TeamsUnreadBadge({ count, sx }: { count: number; sx?: object }) {
  if (count <= 0) return null;
  return (
    <Box
      component="span"
      sx={{
        display: "flex",
        height: 16,
        minWidth: 16,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "999px",
        bgcolor: "primary.main",
        color: "primary.contrastText",
        px: 0.5,
        fontSize: 10,
        fontWeight: 700,
        ...sx,
      }}
    >
      {count > 99 ? "99+" : count}
    </Box>
  );
}

/** Chip compacto (ícone + nome + tamanho) para arquivos genéricos e fallback de PDF. */
function AttachmentChip({
  attachment,
  fromUser,
  onOpen,
  isPdf,
}: {
  attachment: TeamsAttachment;
  fromUser: boolean;
  onOpen: () => void;
  isPdf?: boolean;
}) {
  const pdf = isPdf ?? isPdfAttachment(attachment.contentType, attachment.filename);
  return (
    <ButtonBase
      onClick={onOpen}
      sx={{
        display: "flex",
        maxWidth: 240,
        alignItems: "center",
        gap: 1,
        borderRadius: "8px",
        px: 1.5,
        py: 1,
        textAlign: "left",
        bgcolor: fromUser
          ? "color-mix(in srgb, var(--mui-palette-primary-contrastText) 15%, transparent)"
          : "action.hover",
        "&:hover": {
          bgcolor: fromUser
            ? "color-mix(in srgb, var(--mui-palette-primary-contrastText) 25%, transparent)"
            : "action.selected",
        },
      }}
    >
      <InsertDriveFileOutlinedIcon
        sx={{ fontSize: 20, flexShrink: 0, color: fromUser ? "primary.contrastText" : "text.secondary" }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="body2"
          noWrap
          sx={{ fontWeight: 600, color: fromUser ? "primary.contrastText" : "text.primary" }}
        >
          {attachment.filename}
        </Typography>
        <Typography
          variant="caption"
          sx={{ display: "block", color: fromUser ? "color-mix(in srgb, var(--mui-palette-primary-contrastText) 70%, transparent)" : "text.secondary" }}
        >
          {pdf ? "PDF · " : ""}
          {formatAttachmentSize(attachment.size)}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

/**
 * Miniatura de PDF renderizando a 1ª página num canvas (pdfjs), igual ao CRM.
 * O team não gera thumbnail de PDF (só de imagem raster), então o preview é feito
 * no cliente. O worker é servido de /public (sem CDN). Os bytes vêm do proxy
 * autenticado do CRM (mesma origem → cookie enviado).
 */
let pdfWorkerReady = false;
async function ensurePdfWorker() {
  if (pdfWorkerReady) return;
  pdfWorkerReady = true;
  const { GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

const PDF_THUMB_WIDTH = 180;

function TeamsPdfThumbnail({
  conversationId,
  attachment,
  fromUser,
  onOpen,
}: {
  conversationId: string;
  attachment: TeamsAttachment;
  fromUser: boolean;
  onOpen: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    // Reset síncrono seria flagged pelo lint (react-hooks/set-state-in-effect); agenda para o próximo tick.
    const resetTimer = setTimeout(() => {
      if (!cancelled) setState("loading");
    }, 0);
    (async () => {
      try {
        await ensurePdfWorker();
        const pdfjs = await import("pdfjs-dist");
        const res = await fetch(teamsAttachmentUrl(conversationId, attachment.artifactId), {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const buf = await res.arrayBuffer();
        if (cancelled) return;
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
        if (cancelled) return;
        const page = await pdf.getPage(1);
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: PDF_THUMB_WIDTH / base.width });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        await page.render({ canvas, viewport }).promise;
        if (!cancelled) setState("done");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
      clearTimeout(resetTimer);
    };
  }, [conversationId, attachment.artifactId]);

  // Falha no render → cai no chip (mesmo visual do arquivo genérico).
  if (state === "error") {
    return <AttachmentChip attachment={attachment} fromUser={fromUser} onOpen={onOpen} isPdf />;
  }

  return (
    <ButtonBase
      onClick={onOpen}
      aria-label={`Abrir ${attachment.filename}`}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        width: PDF_THUMB_WIDTH,
        borderRadius: "10px",
        overflow: "hidden",
        border: "1px solid",
        borderColor: fromUser
          ? "color-mix(in srgb, var(--mui-palette-primary-contrastText) 25%, transparent)"
          : "divider",
        "&:hover": { opacity: 0.95 },
      }}
    >
      <Box sx={{ position: "relative", width: "100%", bgcolor: "#fff" }}>
        <canvas
          ref={canvasRef}
          style={{ width: "100%", display: state === "done" ? "block" : "none" }}
        />
        {state === "loading" ? (
          <Box sx={{ height: 208, width: "100%", display: "grid", placeItems: "center", bgcolor: "action.hover" }}>
            <CircularProgress size={20} />
          </Box>
        ) : null}
        <Box
          sx={{
            position: "absolute",
            top: 6,
            right: 6,
            display: "grid",
            placeItems: "center",
            width: 24,
            height: 24,
            borderRadius: "6px",
            bgcolor: "color-mix(in srgb, var(--mui-palette-background-paper) 80%, transparent)",
          }}
        >
          <OpenInFullIcon sx={{ fontSize: 14 }} />
        </Box>
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          px: 1.25,
          py: 1,
          borderTop: "1px solid",
          borderColor: fromUser
            ? "color-mix(in srgb, var(--mui-palette-primary-contrastText) 20%, transparent)"
            : "divider",
          bgcolor: fromUser
            ? "color-mix(in srgb, var(--mui-palette-primary-contrastText) 10%, transparent)"
            : "action.hover",
        }}
      >
        <InsertDriveFileOutlinedIcon
          sx={{ fontSize: 14, flexShrink: 0, color: fromUser ? "primary.contrastText" : "text.secondary" }}
        />
        <Typography
          variant="caption"
          noWrap
          sx={{ fontWeight: 600, color: fromUser ? "primary.contrastText" : "text.primary" }}
        >
          {attachment.filename}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

function AttachmentThumb({
  attachment,
  conversationId,
  fromUser,
  onOpen,
}: {
  attachment: TeamsAttachment;
  conversationId: string;
  fromUser: boolean;
  onOpen: () => void;
}) {
  const isImage = isImageAttachment(attachment.contentType);
  const isPdf = isPdfAttachment(attachment.contentType, attachment.filename);

  if (isImage) {
    return (
      <ButtonBase
        onClick={onOpen}
        aria-label={`Abrir ${attachment.filename}`}
        sx={{ display: "block", position: "relative", borderRadius: "8px", overflow: "hidden", cursor: "zoom-in" }}
      >
        <Box
          component="img"
          src={teamsAttachmentUrl(conversationId, attachment.artifactId, true)}
          alt={attachment.filename}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            // sem thumbnail no team → cai pro conteúdo original
            const img = e.currentTarget;
            const full = teamsAttachmentUrl(conversationId, attachment.artifactId);
            if (img.src !== full) img.src = full;
          }}
          sx={{
            maxHeight: 208,
            maxWidth: 208,
            borderRadius: "8px",
            objectFit: "cover",
            display: "block",
          }}
        />
      </ButtonBase>
    );
  }

  if (isPdf) {
    return (
      <TeamsPdfThumbnail
        conversationId={conversationId}
        attachment={attachment}
        fromUser={fromUser}
        onOpen={onOpen}
      />
    );
  }

  return <AttachmentChip attachment={attachment} fromUser={fromUser} onOpen={onOpen} />;
}

function MessageBubble({
  message,
  dense,
  conversationId,
  agentName,
  onOpenViewer,
}: {
  message: TeamsMessage;
  dense?: boolean;
  conversationId?: string;
  /** Nome do agente da conversa — identifica QUEM fala nos balões de agente. */
  agentName?: string | null;
  onOpenViewer?: (attachment: TeamsAttachment) => void;
}) {
  const fromUser = isUserAuthor(message.authorType);
  const attachments = message.attachments ?? [];
  const hasText =
    message.content.trim().length > 0 && !(attachments.length > 0 && message.content.trim().startsWith("📎"));

  return (
    <Box sx={{ display: "flex", width: "100%", justifyContent: fromUser ? "flex-end" : "flex-start" }}>
      <Box
        sx={{
          position: "relative",
          borderRadius: "16px",
          px: 1.5,
          py: 1,
          maxWidth: dense ? "88%" : { xs: "78%", sm: "70%" },
          ...(fromUser
            ? { borderBottomRightRadius: "4px", bgcolor: "primary.main", color: "primary.contrastText" }
            : { borderBottomLeftRadius: "4px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper", color: "text.primary" }),
        }}
      >
        {!fromUser ? (
          <Typography
            sx={{ display: "block", mb: 0.25, fontSize: 11, fontWeight: 600, color: agentNameColor(message.agentId ?? message.agentName ?? agentName ?? "Agente") }}
          >
            {message.agentName ?? agentName ?? "Agente"}
          </Typography>
        ) : null}
        {hasText ? (
          <Typography
            sx={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: dense ? 13 : 14,
              lineHeight: 1.5,
            }}
          >
            <RichText content={message.content} fromUser={fromUser} />
          </Typography>
        ) : null}
        {attachments.length > 0 && conversationId ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: hasText ? 1 : 0 }}>
            {attachments.map((attachment) => (
              <AttachmentThumb
                key={attachment.artifactId}
                attachment={attachment}
                conversationId={conversationId}
                fromUser={fromUser}
                onOpen={() => onOpenViewer?.(attachment)}
              />
            ))}
          </Box>
        ) : null}
        <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 0.5, justifyContent: fromUser ? "flex-end" : "flex-start" }}>
          <Typography
            variant="caption"
            sx={{ fontSize: 10, color: fromUser ? "color-mix(in srgb, var(--mui-palette-primary-contrastText) 70%, transparent)" : "text.secondary" }}
          >
            {formatMessageTime(message.createdAt)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

/** Modal de visualização (estilo CRM): imagem object-contain, PDF em iframe, vídeo, ou download. */
export function TeamsMediaViewerModal({
  open,
  onOpenChange,
  conversationId,
  attachment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  attachment: TeamsAttachment | null;
}) {
  if (!attachment) return null;
  const url = teamsAttachmentUrl(conversationId, attachment.artifactId);
  const isImage = isImageAttachment(attachment.contentType);
  const isPdf = isPdfAttachment(attachment.contentType, attachment.filename);
  const isVideo = attachment.contentType.startsWith("video/");

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="lg" fullWidth>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, borderBottom: "1px solid", borderColor: "divider", px: 2.5, py: 1.5 }}>
        <Typography variant="subtitle1" noWrap sx={{ fontWeight: 600 }}>
          {attachment.filename}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Button
            component="a"
            href={url}
            download={attachment.filename}
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
          >
            Baixar
          </Button>
          <IconButton size="small" onClick={() => onOpenChange(false)} aria-label="Fechar">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
      <Box sx={{ display: "flex", minHeight: 240, flex: 1, alignItems: "center", justifyContent: "center", overflow: "auto", bgcolor: "action.hover", p: 2 }}>
        {isImage ? (
          <Box component="img" src={url} alt={attachment.filename} sx={{ maxHeight: "78vh", width: "auto", maxWidth: "100%", borderRadius: "8px", objectFit: "contain" }} />
        ) : isVideo ? (
          <Box component="video" src={url} controls sx={{ maxHeight: "78vh", width: "100%", maxWidth: "100%", borderRadius: "8px", bgcolor: "#000" }} />
        ) : isPdf ? (
          <Box component="iframe" src={url} title={attachment.filename} sx={{ height: "78vh", width: "100%", borderRadius: "8px", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }} />
        ) : (
          <Stack spacing={1.5} sx={{ alignItems: "center", py: 5, textAlign: "center" }}>
            <InsertDriveFileOutlinedIcon sx={{ fontSize: 48, color: "text.secondary" }} />
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {attachment.filename}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatAttachmentSize(attachment.size)}
            </Typography>
            <Button component="a" href={url} download={attachment.filename} variant="contained" startIcon={<DownloadIcon />}>
              Baixar arquivo
            </Button>
          </Stack>
        )}
      </Box>
    </Dialog>
  );
}

type ThreadProps = {
  messages: TeamsMessage[];
  dense?: boolean;
  emptyState?: ReactNode;
  sx?: object;
  /** Necessário para montar as URLs dos anexos e o modal de visualização. */
  conversationId?: string;
  /** Nome do agente da conversa — identifica os balões de agente. */
  agentName?: string | null;
};

/**
 * Fluxo de mensagens com separadores de dia e auto-scroll pro fim quando chegam
 * mensagens novas. O fundo doodle (mesmo asset do CRM de referência) fica no
 * container — os balões e o separador flutuam sobre ele.
 */
export function TeamsChatThread({ messages, dense, emptyState, sx, conversationId, agentName }: ThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<TeamsAttachment | null>(null);
  const lastMessageId = messages[messages.length - 1]?.id;

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastMessageId]);

  return (
    <Box
      ref={scrollRef}
      sx={{
        flex: 1,
        overflowY: "auto",
        px: { xs: 1.5, sm: 2 },
        py: 1.5,
        ...chatDoodleSx,
        ...sx,
      }}
    >
      {messages.length === 0 ? (
        (emptyState ?? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            Nenhuma mensagem ainda. Escreva abaixo para começar.
          </Typography>
        ))
      ) : (
        <Stack spacing={2}>
          {groupMessagesByDay(messages).map((group) => (
            <Box key={group.day}>
              <Box sx={{ mb: 1.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Box
                  sx={{
                    borderRadius: "999px",
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                    px: 1.5,
                    py: 0.5,
                    boxShadow: 1,
                  }}
                >
                  <Typography sx={{ fontSize: 10, fontWeight: 500, lineHeight: 1.4, color: "text.secondary" }}>
                    {group.day}
                  </Typography>
                </Box>
              </Box>
              <Stack spacing={dense ? 0.75 : 1}>
                {group.messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    dense={dense}
                    conversationId={conversationId}
                    agentName={agentName}
                    onOpenViewer={setViewer}
                  />
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
      {conversationId ? (
        <TeamsMediaViewerModal
          open={viewer !== null}
          onOpenChange={(open) => !open && setViewer(null)}
          conversationId={conversationId}
          attachment={viewer}
        />
      ) : null}
    </Box>
  );
}

/** Atalhos das principais ações — preenchem o input e o usuário complementa antes de enviar. */
export const TEAMS_SHORTCUT_ACTIONS: Array<{ label: string; fill: string }> = [
  { label: "Criar novo cliente", fill: "Preciso cadastrar um novo cliente no sistema. Dados do cliente: " },
  { label: "Consultar protocolo", fill: "Preciso consultar um protocolo SSDR. Número do protocolo ou placa: " },
  { label: "Consultar andamento", fill: "Quero saber o andamento do seguinte processo/solicitação: " },
  { label: "Gerar relatório", fill: "Preciso de um relatório. Período e informações desejadas: " },
  {
    label: "Corrigir erro na tela atual",
    fill:
      "Estou com um erro nesta tela. Por favor, analise o problema, identifique a causa e me oriente ou execute a correção necessária. Detalhes adicionais: ",
  },
  { label: "Solicitar melhoria", fill: "Tenho uma sugestão de melhoria para o sistema: " },
  { label: "Nova funcionalidade", fill: "Preciso de uma nova funcionalidade no sistema. Descrição do que ela deve fazer: " },
  { label: "Validar dados de cadastro", fill: "Preciso validar os dados de um cadastro. Cadastro e campos a conferir: " },
  { label: "Problema no pagamento", fill: "Identifiquei um possível problema em um pagamento. Detalhes (cliente, valor, data): " },
  { label: "Ajuda de uso", fill: "Preciso de ajuda para usar uma função do sistema. O que estou tentando fazer: " },
  { label: "Analisar inconsistência", fill: "Encontrei uma inconsistência nos dados. Onde ela aparece e o que era esperado: " },
  { label: "Automatizar fluxo", fill: "Gostaria de automatizar um fluxo de trabalho. Fluxo atual e resultado esperado: " },
];

export function TeamsShortcutChips({
  onPick,
  limit,
  sx,
}: {
  onPick: (fill: string) => void;
  limit?: number;
  sx?: object;
}) {
  const actions = limit ? TEAMS_SHORTCUT_ACTIONS.slice(0, limit) : TEAMS_SHORTCUT_ACTIONS;
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, ...sx }}>
      {actions.map((action) => (
        <Chip
          key={action.label}
          size="small"
          variant="outlined"
          label={action.label}
          onClick={() => onPick(action.fill)}
          sx={{ cursor: "pointer" }}
        />
      ))}
    </Box>
  );
}

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  sending: boolean;
  disabled?: boolean;
  placeholder?: string;
  topSlot?: ReactNode;
  hint?: string;
  dense?: boolean;
  autoFocus?: boolean;
  /** Habilita anexos: recebe os arquivos escolhidos + o texto atual. Mostra o clipe no composer. */
  onAttach?: (files: File[], message: string) => void | Promise<void>;
  attachAccept?: string;
};

/** Barra de envio no padrão do CRM: textarea arredondada + botão de enviar quadrado. Enter envia, Shift+Enter quebra linha. */
export function TeamsComposer({
  value,
  onChange,
  onSend,
  sending,
  disabled,
  placeholder,
  topSlot,
  hint,
  dense,
  autoFocus,
  onAttach,
  attachAccept,
}: ComposerProps) {
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    if (disabled || sending) return;
    if (pendingFiles.length > 0 && onAttach) {
      const files = pendingFiles;
      setPendingFiles([]);
      void onAttach(files, value);
      return;
    }
    if (!value.trim()) return;
    void onSend();
  };

  const canSend = !disabled && !sending && (value.trim().length > 0 || pendingFiles.length > 0);

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexShrink: 0,
        flexDirection: "column",
        gap: 1,
        borderTop: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        p: dense ? 1.25 : { xs: 1.5, sm: 2 },
      }}
    >
      {topSlot}
      {pendingFiles.length > 0 ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {pendingFiles.map((file, index) => (
            <Chip
              key={`${file.name}-${index}`}
              size="small"
              icon={<InsertDriveFileOutlinedIcon sx={{ fontSize: 14 }} />}
              label={file.name}
              onDelete={() => setPendingFiles((prev) => prev.filter((_, i) => i !== index))}
            />
          ))}
        </Box>
      ) : null}
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
        {onAttach ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={attachAccept}
              style={{ display: "none" }}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length > 0) setPendingFiles((prev) => [...prev, ...files].slice(0, 5));
                e.target.value = "";
              }}
            />
            <IconButton
              disabled={disabled || sending}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Anexar arquivo"
              title="Anexar arquivo"
              sx={{ flexShrink: 0, width: 40, height: 40, borderRadius: "8px" }}
            >
              <AttachFileIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </>
        ) : null}
        <TextField
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "Escreva uma mensagem…"}
          multiline
          minRows={dense ? 1 : 2}
          maxRows={6}
          disabled={disabled}
          autoFocus={autoFocus}
          fullWidth
          size="small"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          sx={{
            "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "action.hover" },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={!canSend}
          aria-label="Enviar mensagem"
          sx={{
            flexShrink: 0,
            width: 40,
            height: 40,
            minWidth: 40,
            px: 0,
            borderRadius: "8px",
          }}
        >
          {sending ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <SendIcon sx={{ fontSize: 18 }} />
          )}
        </Button>
      </Box>
      {hint ? (
        <Typography color="text.secondary" sx={{ fontSize: 10, lineHeight: 1.4 }}>
          {hint}
        </Typography>
      ) : null}
    </Box>
  );
}

/** Estado vazio/erro/aviso padronizado (spec de estados: mensagem clara + orientação). */
export function TeamsEmptyState({
  icon,
  title,
  description,
  action,
  sx,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  sx?: object;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // setState síncrono aqui seria flagged pelo lint; agenda para o próximo tick.
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        px: 3,
        py: 5,
        textAlign: "center",
        ...sx,
      }}
    >
      {icon ? (
        <Box
          sx={{
            mb: 0.5,
            display: "grid",
            placeItems: "center",
            width: 48,
            height: 48,
            borderRadius: "999px",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            opacity: mounted ? 1 : 0,
            transition: "opacity 0.5s",
          }}
        >
          {icon}
        </Box>
      ) : null}
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
          {description}
        </Typography>
      ) : null}
      {action ? <Box sx={{ mt: 1 }}>{action}</Box> : null}
    </Box>
  );
}

import type {
  ChatContentType,
  ChatMessageDto,
  ConversationDto,
} from "@/types/api/conversation";
import { isTempMessageId } from "@/hooks/conversations/use-send-message";

export { getInitials } from "@/lib/format/initials";

/** Nome de exibição do contato (nome → cliente → telefone) ou assunto do grupo. */
export function conversationDisplayName(conversation: ConversationDto): string {
  if (conversation.chatType === "group") {
    return conversation.contactName?.trim() || "Grupo";
  }
  return (
    conversation.contactName ||
    conversation.customerName ||
    conversation.contactPhone
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Horário relativo pt-BR para a lista de conversas (estilo WhatsApp):
 * agora → "agora"; hoje → HH:mm; ontem → "ontem"; últimos 7 dias → dia da
 * semana; senão → dd/mm/aaaa.
 */
export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();

  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 60_000 && diffMs >= 0) return "agora";

  if (isSameDay(date, now)) {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return "ontem";

  const daysAgo =
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / 86_400_000;
  if (daysAgo < 7) {
    return new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date);
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/** HH:mm da bolha. */
export function formatMessageTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Rótulo do separador de dia: Hoje / Ontem / data por extenso. */
export function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (isSameDay(date, now)) return "Hoje";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Ontem";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export type MessageDayGroup = {
  key: string;
  label: string;
  items: ChatMessageDto[];
};

/** Agrupa mensagens (ascendentes) por dia. */
export function groupMessagesByDay(
  messages: ChatMessageDto[],
): MessageDayGroup[] {
  const groups: MessageDayGroup[] = [];
  for (const message of messages) {
    const date = new Date(message.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(message);
    } else {
      groups.push({ key, label: formatDayLabel(message.createdAt), items: [message] });
    }
  }
  return groups;
}

const CONTENT_TYPE_PREVIEW: Record<ChatContentType, string> = {
  text: "Mensagem",
  image: "📷 Foto",
  video: "🎥 Vídeo",
  audio: "🎵 Áudio",
  document: "📄 Documento",
  sticker: "Figurinha",
  location: "📍 Localização",
  contact_card: "👤 Contato",
  unknown: "Mensagem",
};

/** Preview compacto para citações (reply) e afins. */
export function buildMessagePreview(input: {
  contentType: ChatContentType;
  contentText: string | null;
  isVoiceNote?: boolean;
}): string {
  if (input.contentText) return input.contentText;
  if (input.contentType === "audio" && input.isVoiceNote) {
    return "🎤 Mensagem de voz";
  }
  return CONTENT_TYPE_PREVIEW[input.contentType] ?? "Mensagem";
}

/** Mensagens que podem ser encaminhadas (não apagadas, já enviadas, com conteúdo suportado). */
export function isForwardableMessage(message: ChatMessageDto): boolean {
  if (message.deletedAt) return false;
  if (isTempMessageId(message.id)) return false;
  if (message.status === "sending" || message.status === "failed") return false;
  return message.contentType !== "unknown";
}

/** Detecção de PDF para thumbnail dedicado. */
export function isPdfMessage(message: ChatMessageDto): boolean {
  if (message.contentType !== "document" || !message.media) return false;
  if (message.media.mimeType === "application/pdf") return true;
  return message.media.fileName?.toLowerCase().endsWith(".pdf") ?? false;
}

/** Tamanho de arquivo legível (pt-BR). */
export function formatFileSize(sizeBytes: number | null): string {
  if (sizeBytes == null || sizeBytes <= 0) return "";
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(0)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Formata telefone BR (10/11 dígitos, com ou sem +55) para exibição. */
export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  // Ids de grupo WhatsApp são longos demais para ser telefone — evita lixo na UI.
  if (digits.length > 13) return "Grupo";
  const local = digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return phone;
}

export const thinScrollSx = {
  overflowY: "auto",
  overflowX: "hidden",
  scrollbarWidth: "thin",
  scrollbarColor:
    "color-mix(in srgb, var(--mui-palette-text-primary) 16%, transparent) transparent",
  "&::-webkit-scrollbar": { width: 5 },
  "&::-webkit-scrollbar-track": { background: "transparent" },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor:
      "color-mix(in srgb, var(--mui-palette-text-primary) 16%, transparent)",
    borderRadius: 999,
  },
} as const;

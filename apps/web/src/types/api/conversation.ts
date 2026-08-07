export type ConversationStatus = "open" | "pending" | "closed";

/** Escopo do inbox: todas / minhas / não atribuídas (query `scope`). */
export type ConversationScope = "all" | "mine" | "unassigned";

/** Filtro de leitura (query `filter`). */
export type ConversationReadFilter = "all" | "unread";

export type ConversationDto = {
  id: string;
  /** DM 1:1 vs grupo WhatsApp (`@g.us`). */
  chatType: "direct" | "group";
  contactPhone: string;
  contactName: string | null;
  avatarUrl: string | null;
  customerId: string | null;
  customerContactId: string | null;
  customerName: string | null;
  assigneeMembershipId: string | null;
  status: ConversationStatus;
  unreadCount: number;
  lastMessageText: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessageDirection = "inbound" | "outbound";

export type ChatSenderType = "customer" | "agent" | "system";

export type ChatContentType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "sticker"
  | "location"
  | "contact_card"
  | "unknown";

export type ChatMessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export type ChatMessageMedia = {
  fileName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  isVoiceNote: boolean;
};

export type ChatMessageReplyTo = {
  id: string;
  senderType: ChatSenderType;
  contentType: ChatContentType;
  contentText: string | null;
  senderName: string | null;
};

export type ChatMessageReaction = {
  emoji: string;
  actorKey: string;
  actorMembershipId: string | null;
  actorName: string | null;
};

export type ChatMessageContactCardEntry = {
  name: string | null;
  phone: string | null;
};

export type ChatMessageDto = {
  id: string;
  conversationId: string;
  direction: ChatMessageDirection;
  senderType: ChatSenderType;
  senderMembershipId: string | null;
  senderName: string | null;
  contentType: ChatContentType;
  contentText: string | null;
  media: ChatMessageMedia | null;
  /** contact_card: contatos compartilhados (nome + telefone do vCard). */
  contactCard: ChatMessageContactCardEntry[] | null;
  replyTo: ChatMessageReplyTo | null;
  forwarded: boolean;
  status: ChatMessageStatus;
  errorMessage: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  reactions: ChatMessageReaction[];
};

export type ConversationsQueryParams = {
  search?: string;
  status?: ConversationStatus;
  scope?: ConversationScope;
  filter?: ConversationReadFilter;
};

export type ConversationsListResponse = {
  conversations: ConversationDto[];
};

export type ConversationMessagesPage = {
  conversation: ConversationDto;
  /** Mensagens em ordem ascendente (mais antiga → mais nova) dentro da página. */
  messages: ChatMessageDto[];
  /** Cursor para paginar para trás (mensagens mais antigas); null = fim. */
  nextCursor: string | null;
};

export type ConversationMediaKind = "image" | "video" | "audio" | "document";

export type SendMediaDescriptor = {
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  kind: ConversationMediaKind;
  voiceNote?: boolean;
};

export type SendTextMessageInput = {
  type: "text";
  contentText: string;
  replyToMessageId?: string;
};

export type SendMediaMessageInput = {
  type: "media";
  media: SendMediaDescriptor;
  /** Legenda (imagem/vídeo/documento). */
  contentText?: string;
  replyToMessageId?: string;
};

export type SendMessageInput = SendTextMessageInput | SendMediaMessageInput;

export type PresignConversationMediaInput = {
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

export type PresignConversationMediaResult = {
  uploadUrl: string;
  storageKey: string;
  headers: Record<string, string>;
  expiresIn: number;
};

export type ForwardMessagesInput = {
  sourceMessageIds: string[];
  targetConversationIds: string[];
};

export type ForwardMessagesResult = {
  results: Array<{ conversationId: string; sent: number; failed: number }>;
};

export type MessageDownloadResult = {
  downloadUrl: string;
  expiresIn: number;
  fileName: string | null;
  mimeType: string | null;
};

export type ConversationEvent =
  | { type: "message.new"; conversationId: string; message: ChatMessageDto }
  | { type: "message.updated"; conversationId: string; message: ChatMessageDto }
  | { type: "conversation.updated"; conversation: ConversationDto };

export const CONVERSATION_STATUS_LABELS: Record<ConversationStatus, string> = {
  open: "Aberta",
  pending: "Pendente",
  closed: "Fechada",
};

export const CONVERSATION_SCOPE_LABELS: Record<ConversationScope, string> = {
  all: "Todas",
  mine: "Minhas conversas",
  unassigned: "Não atribuídas",
};

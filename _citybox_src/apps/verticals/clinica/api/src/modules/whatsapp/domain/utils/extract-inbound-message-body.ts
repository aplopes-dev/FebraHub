export const NON_TEXT_INBOUND_PLACEHOLDER = '[mensagem não textual]';

/** Shape mínimo da mensagem Baileys — evita acoplar o domínio ao SDK. */
export type InboundWaMessageLike = {
  message?: InboundWaContentLike | null;
};

type InboundWaContentLike = {
  conversation?: string | null;
  extendedTextMessage?: { text?: string | null } | null;
  imageMessage?: { caption?: string | null } | null;
  videoMessage?: { caption?: string | null } | null;
  documentMessage?: { caption?: string | null } | null;
  buttonsResponseMessage?: { selectedDisplayText?: string | null } | null;
  listResponseMessage?: { title?: string | null } | null;
  templateButtonReplyMessage?: {
    selectedDisplayText?: string | null;
  } | null;
  stickerMessage?: unknown;
  audioMessage?: unknown;
  contactMessage?: unknown;
  contactsArrayMessage?: unknown;
  locationMessage?: unknown;
  liveLocationMessage?: unknown;
  reactionMessage?: unknown;
  ephemeralMessage?: { message?: InboundWaContentLike | null } | null;
  viewOnceMessage?: { message?: InboundWaContentLike | null } | null;
  viewOnceMessageV2?: { message?: InboundWaContentLike | null } | null;
  viewOnceMessageV2Extension?: {
    message?: InboundWaContentLike | null;
  } | null;
};

/**
 * Extrai o conteúdo relevante de uma mensagem inbound.
 * Texto (ou legenda de mídia) → body; figurinha/áudio/imagem sem legenda → placeholder;
 * eventos de protocolo/recibo → null (ignorar).
 */
export function extractInboundMessageBody(
  msg: InboundWaMessageLike,
): string | null {
  const raw = msg.message;
  if (!raw) return null;

  const content = unwrapMessageContent(raw);

  const text = pickText(content);
  if (text !== null) return text;

  if (hasNonTextUserContent(content)) {
    return NON_TEXT_INBOUND_PLACEHOLDER;
  }

  return null;
}

function unwrapMessageContent(
  content: InboundWaContentLike,
): InboundWaContentLike {
  return (
    content.ephemeralMessage?.message ||
    content.viewOnceMessage?.message ||
    content.viewOnceMessageV2?.message ||
    content.viewOnceMessageV2Extension?.message ||
    content
  );
}

function pickText(content: InboundWaContentLike): string | null {
  const candidates = [
    content.conversation,
    content.extendedTextMessage?.text,
    content.imageMessage?.caption,
    content.videoMessage?.caption,
    content.documentMessage?.caption,
    content.buttonsResponseMessage?.selectedDisplayText,
    content.listResponseMessage?.title,
    content.templateButtonReplyMessage?.selectedDisplayText,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

function hasNonTextUserContent(content: InboundWaContentLike): boolean {
  return Boolean(
    content.stickerMessage ||
      content.imageMessage ||
      content.audioMessage ||
      content.videoMessage ||
      content.documentMessage ||
      content.contactMessage ||
      content.contactsArrayMessage ||
      content.locationMessage ||
      content.liveLocationMessage ||
      content.reactionMessage,
  );
}

import type { InboundReplyAction } from '../whatsapp.types';

/**
 * Só `1` (confirmar) e `2` (cancelar) contam.
 * Qualquer outro texto, emoji, mídia etc. → `unknown`.
 */
export function parseInboundReply(raw: string): InboundReplyAction {
  const normalized = raw.trim();

  if (normalized === '1') return 'confirm';
  if (normalized === '2') return 'cancel';
  return 'unknown';
}

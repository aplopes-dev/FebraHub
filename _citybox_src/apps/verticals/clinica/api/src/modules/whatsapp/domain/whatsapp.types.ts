export type WhatsappConnectionStatus =
  | 'disconnected'
  | 'qr_pending'
  | 'connected'
  | 'error';

export type WhatsappTemplateKey =
  | 'appointment_confirmation'
  | 'mgm'
  | 'debit_overdue'
  | 'treatment_return'
  | 'birthday'
  | 'nps';

export type WhatsappMessageDirection = 'outbound' | 'inbound';

export type WhatsappMessageStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'received';

export const WHATSAPP_TEMPLATE_KEYS: readonly WhatsappTemplateKey[] = [
  'appointment_confirmation',
  'mgm',
  'debit_overdue',
  'treatment_return',
  'birthday',
  'nps',
] as const;

export const CONFIRMATION_REPLY_TTL_MS = 24 * 60 * 60 * 1000;

/** Antecedência do lembrete de consulta confirmada. */
export const APPOINTMENT_REMINDER_LEAD_MS = 2 * 60 * 60 * 1000;

/**
 * Antecedência do lembrete quando o paciente ainda não respondeu 1/2
 * (status permanece `scheduled`; só o texto da mensagem diz "confirmada").
 */
export const APPOINTMENT_PENDING_REMINDER_LEAD_MS = 5 * 60 * 1000;

/** Intervalo do scanner de lembretes no worker. */
export const APPOINTMENT_REMINDER_POLL_MS = 60 * 1000;

export type InboundReplyAction = 'confirm' | 'cancel' | 'unknown';

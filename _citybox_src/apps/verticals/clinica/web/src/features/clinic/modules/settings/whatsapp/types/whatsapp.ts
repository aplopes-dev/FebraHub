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

export type WhatsappSession = {
  status: WhatsappConnectionStatus;
  phoneE164: string | null;
  lastError: string | null;
  qrBase64: string | null;
  updatedAt: string;
};

export type WhatsappTemplateItem = {
  key: WhatsappTemplateKey;
  body: string;
  updatedAt: string;
};

export type WhatsappVariable = {
  id: string;
  label: string;
  /** Token persistido na API, ex.: `{nome_paciente}`. */
  token: string;
};

export const WHATSAPP_VARIABLE_DRAG_MIME =
  'application/x-citybox-whatsapp-variable';

export const WHATSAPP_TEMPLATE_LABELS: Record<WhatsappTemplateKey, string> = {
  appointment_confirmation: 'Template confirmação de consulta',
  mgm: 'Template indique e ganhe',
  debit_overdue: 'Template débito em atraso',
  treatment_return: 'Template retorno de procedimento',
  birthday: 'Template aniversário',
  nps: 'Template pesquisa de satisfação',
};

export const WHATSAPP_STATUS_LABEL: Record<WhatsappConnectionStatus, string> = {
  disconnected: 'Desconectado',
  qr_pending: 'Aguardando QR',
  connected: 'Conectado',
  error: 'Erro',
};

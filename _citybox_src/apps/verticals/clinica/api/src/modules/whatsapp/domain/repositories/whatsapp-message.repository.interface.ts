import type { WhatsappMessage } from '../entities/whatsapp-message.entity';

export type WhatsappMessageListCriteria = {
  skip: number;
  take: number;
  /** Só outbound que já têm ao menos uma resposta inbound com o mesmo correlationId. */
  withRepliesOnly?: boolean;
  /** Filtro por nome do paciente (contains, case-insensitive). */
  search?: string;
};

export type WhatsappMessageWithPatient = {
  message: WhatsappMessage;
  patientName: string;
  replyBody: string | null;
  repliedAt: Date | null;
};

/** Janela em que respostas à felicitações de aniversário ainda são atribuídas. */
export const BIRTHDAY_REPLY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export abstract class WhatsappMessageRepository {
  abstract save(message: WhatsappMessage): Promise<WhatsappMessage>;
  abstract findById(
    storeId: string,
    id: string,
  ): Promise<WhatsappMessage | null>;
  abstract listByPatient(
    storeId: string,
    patientId: string,
    criteria: WhatsappMessageListCriteria,
  ): Promise<{ items: WhatsappMessage[]; total: number }>;
  /** Última confirmação outbound ativa (não expirada) para o telefone. */
  abstract findActiveConfirmationByPhone(
    storeId: string,
    toE164: string,
    now?: Date,
  ): Promise<WhatsappMessage | null>;
  /**
   * Último disparo de aniversário outbound para o telefone
   * (ainda dentro da janela de resposta).
   */
  abstract findLatestBirthdayOutboundByPhone(
    storeId: string,
    toE164: string,
    now?: Date,
  ): Promise<WhatsappMessage | null>;
  abstract existsByCorrelationId(
    storeId: string,
    correlationId: string,
  ): Promise<boolean>;
  /** Conta mensagens cujo correlationId começa com o prefixo (ex.: birthday:{campaignId}:). */
  abstract countByCorrelationIdPrefix(
    storeId: string,
    correlationIdPrefix: string,
  ): Promise<number>;
  /** Última mensagem outbound com correlationId no prefixo (mais recente por createdAt). */
  abstract findLatestByCorrelationIdPrefix(
    storeId: string,
    correlationIdPrefix: string,
  ): Promise<WhatsappMessage | null>;
  abstract listByCorrelationIdPrefix(
    storeId: string,
    correlationIdPrefix: string,
    criteria: WhatsappMessageListCriteria,
  ): Promise<{ items: WhatsappMessageWithPatient[]; total: number }>;
  abstract findByProviderMessageId(
    storeId: string,
    providerMessageId: string,
  ): Promise<WhatsappMessage | null>;
}

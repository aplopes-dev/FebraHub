import { randomUUID } from 'node:crypto';
import { WhatsappMessage } from '../domain/entities/whatsapp-message.entity';
import {
  BIRTHDAY_REPLY_WINDOW_MS,
  type WhatsappMessageListCriteria,
  type WhatsappMessageRepository,
  type WhatsappMessageWithPatient,
} from '../domain/repositories/whatsapp-message.repository.interface';
import { whatsappE164Variants } from '../domain/utils/phone-e164';

export class InMemoryWhatsappMessageRepository implements WhatsappMessageRepository {
  private readonly rows = new Map<string, WhatsappMessage>();
  private readonly patientNames = new Map<string, string>();

  save(message: WhatsappMessage): Promise<WhatsappMessage> {
    const id = message.id || randomUUID();
    const saved = WhatsappMessage.with(
      {
        storeId: message.storeId,
        patientId: message.patientId,
        appointmentId: message.appointmentId,
        direction: message.direction,
        body: message.body,
        toE164: message.toE164,
        status: message.status,
        templateKey: message.templateKey,
        providerMessageId: message.providerMessageId,
        correlationId: message.correlationId,
        expiresAt: message.expiresAt,
        attemptCount: message.attemptCount,
        lastError: message.lastError,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      },
      id,
    );
    this.rows.set(id, saved);
    return Promise.resolve(saved);
  }

  findById(storeId: string, id: string): Promise<WhatsappMessage | null> {
    const row = this.rows.get(id);
    if (!row || row.storeId !== storeId) return Promise.resolve(null);
    return Promise.resolve(row);
  }

  listByPatient(
    storeId: string,
    patientId: string,
    criteria: WhatsappMessageListCriteria,
  ): Promise<{ items: WhatsappMessage[]; total: number }> {
    const all = Array.from(this.rows.values())
      .filter((m) => m.storeId === storeId && m.patientId === patientId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return Promise.resolve({
      items: all.slice(criteria.skip, criteria.skip + criteria.take),
      total: all.length,
    });
  }

  findActiveConfirmationByPhone(
    storeId: string,
    toE164: string,
    now = new Date(),
  ): Promise<WhatsappMessage | null> {
    const phones = whatsappE164Variants(toE164);
    const candidates = Array.from(this.rows.values())
      .filter(
        (m) =>
          m.storeId === storeId &&
          phones.includes(m.toE164) &&
          m.direction === 'outbound' &&
          m.templateKey === 'appointment_confirmation' &&
          m.appointmentId != null &&
          (!m.expiresAt || m.expiresAt.getTime() >= now.getTime()),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return Promise.resolve(candidates[0] ?? null);
  }

  findLatestBirthdayOutboundByPhone(
    storeId: string,
    toE164: string,
    now = new Date(),
  ): Promise<WhatsappMessage | null> {
    const phones = whatsappE164Variants(toE164);
    const since = now.getTime() - BIRTHDAY_REPLY_WINDOW_MS;
    const candidates = Array.from(this.rows.values())
      .filter(
        (m) =>
          m.storeId === storeId &&
          phones.includes(m.toE164) &&
          m.direction === 'outbound' &&
          m.templateKey === 'birthday' &&
          m.createdAt.getTime() >= since &&
          typeof m.correlationId === 'string' &&
          m.correlationId.startsWith('birthday:'),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return Promise.resolve(candidates[0] ?? null);
  }

  existsByCorrelationId(
    storeId: string,
    correlationId: string,
  ): Promise<boolean> {
    return Promise.resolve(
      Array.from(this.rows.values()).some(
        (m) => m.storeId === storeId && m.correlationId === correlationId,
      ),
    );
  }

  countByCorrelationIdPrefix(
    storeId: string,
    correlationIdPrefix: string,
  ): Promise<number> {
    return Promise.resolve(
      Array.from(this.rows.values()).filter(
        (m) =>
          m.storeId === storeId &&
          m.direction === 'outbound' &&
          typeof m.correlationId === 'string' &&
          m.correlationId.startsWith(correlationIdPrefix),
      ).length,
    );
  }

  findLatestByCorrelationIdPrefix(
    storeId: string,
    correlationIdPrefix: string,
  ): Promise<WhatsappMessage | null> {
    const matches = Array.from(this.rows.values())
      .filter(
        (m) =>
          m.storeId === storeId &&
          m.direction === 'outbound' &&
          typeof m.correlationId === 'string' &&
          m.correlationId.startsWith(correlationIdPrefix),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return Promise.resolve(matches[0] ?? null);
  }

  listByCorrelationIdPrefix(
    storeId: string,
    correlationIdPrefix: string,
    criteria: WhatsappMessageListCriteria,
  ): Promise<{ items: WhatsappMessageWithPatient[]; total: number }> {
    const outbounds = Array.from(this.rows.values())
      .filter(
        (m) =>
          m.storeId === storeId &&
          m.direction === 'outbound' &&
          typeof m.correlationId === 'string' &&
          m.correlationId.startsWith(correlationIdPrefix),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const usedInboundIds = new Set<string>();
    let enriched: WhatsappMessageWithPatient[] = outbounds.map((message) => {
      const byCorrelation = Array.from(this.rows.values())
        .filter(
          (m) =>
            m.storeId === storeId &&
            m.direction === 'inbound' &&
            m.correlationId === message.correlationId,
        )
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

      if (byCorrelation) {
        usedInboundIds.add(byCorrelation.id);
        return {
          message,
          patientName: this.patientNames.get(message.patientId) ?? 'Paciente',
          replyBody: byCorrelation.body,
          repliedAt: byCorrelation.createdAt,
        };
      }

      const windowEnd = message.createdAt.getTime() + BIRTHDAY_REPLY_WINDOW_MS;
      const fallback = Array.from(this.rows.values())
        .filter(
          (m) =>
            m.storeId === storeId &&
            m.direction === 'inbound' &&
            m.patientId === message.patientId &&
            !usedInboundIds.has(m.id) &&
            m.createdAt.getTime() > message.createdAt.getTime() &&
            m.createdAt.getTime() <= windowEnd,
        )
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

      if (fallback) {
        usedInboundIds.add(fallback.id);
        return {
          message,
          patientName: this.patientNames.get(message.patientId) ?? 'Paciente',
          replyBody: fallback.body,
          repliedAt: fallback.createdAt,
        };
      }

      return {
        message,
        patientName: this.patientNames.get(message.patientId) ?? 'Paciente',
        replyBody: null,
        repliedAt: null,
      };
    });

    if (criteria.withRepliesOnly) {
      enriched = enriched.filter((item) => item.replyBody != null);
    }

    const search = criteria.search?.trim().toLowerCase();
    if (search) {
      enriched = enriched.filter((item) =>
        item.patientName.toLowerCase().includes(search),
      );
    }

    return Promise.resolve({
      items: enriched.slice(criteria.skip, criteria.skip + criteria.take),
      total: enriched.length,
    });
  }

  findByProviderMessageId(
    storeId: string,
    providerMessageId: string,
  ): Promise<WhatsappMessage | null> {
    const found = Array.from(this.rows.values()).find(
      (m) =>
        m.storeId === storeId && m.providerMessageId === providerMessageId,
    );
    return Promise.resolve(found ?? null);
  }

  /** Test helper: define o nome exibido do paciente. */
  seedPatientName(patientId: string, name: string): void {
    this.patientNames.set(patientId, name);
  }
}

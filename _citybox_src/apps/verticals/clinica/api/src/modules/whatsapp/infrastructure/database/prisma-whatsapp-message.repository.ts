import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { WhatsappMessage } from '../../domain/entities/whatsapp-message.entity';
import {
  WhatsappMessageRepository,
  BIRTHDAY_REPLY_WINDOW_MS,
  type WhatsappMessageListCriteria,
  type WhatsappMessageWithPatient,
} from '../../domain/repositories/whatsapp-message.repository.interface';
import { whatsappE164Variants } from '../../domain/utils/phone-e164';
import type {
  WhatsappMessageDirection,
  WhatsappMessageStatus,
  WhatsappTemplateKey,
} from '../../domain/whatsapp.types';

@Injectable()
export class PrismaWhatsappMessageRepository extends WhatsappMessageRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async save(message: WhatsappMessage): Promise<WhatsappMessage> {
    const row = await this.prisma.whatsappMessage.upsert({
      where: { id: message.id },
      create: {
        id: message.id,
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
      update: {
        status: message.status,
        providerMessageId: message.providerMessageId,
        attemptCount: message.attemptCount,
        lastError: message.lastError,
        updatedAt: message.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  async findById(storeId: string, id: string): Promise<WhatsappMessage | null> {
    const row = await this.prisma.whatsappMessage.findFirst({
      where: { id, storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async listByPatient(
    storeId: string,
    patientId: string,
    criteria: WhatsappMessageListCriteria,
  ): Promise<{ items: WhatsappMessage[]; total: number }> {
    const where = { storeId, patientId };
    const [rows, total] = await Promise.all([
      this.prisma.whatsappMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: criteria.skip,
        take: criteria.take,
      }),
      this.prisma.whatsappMessage.count({ where }),
    ]);
    return { items: rows.map((row) => this.toEntity(row)), total };
  }

  async findActiveConfirmationByPhone(
    storeId: string,
    toE164: string,
    now = new Date(),
  ): Promise<WhatsappMessage | null> {
    const row = await this.prisma.whatsappMessage.findFirst({
      where: {
        storeId,
        toE164: { in: whatsappE164Variants(toE164) },
        direction: 'outbound',
        templateKey: 'appointment_confirmation',
        status: { in: ['queued', 'sent', 'delivered'] },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { createdAt: 'desc' },
    });
    return row ? this.toEntity(row) : null;
  }

  async findLatestBirthdayOutboundByPhone(
    storeId: string,
    toE164: string,
    now = new Date(),
  ): Promise<WhatsappMessage | null> {
    const since = new Date(now.getTime() - BIRTHDAY_REPLY_WINDOW_MS);
    const row = await this.prisma.whatsappMessage.findFirst({
      where: {
        storeId,
        toE164: { in: whatsappE164Variants(toE164) },
        direction: 'outbound',
        templateKey: 'birthday',
        status: { in: ['queued', 'sent', 'delivered'] },
        createdAt: { gte: since },
        correlationId: { startsWith: 'birthday:' },
      },
      orderBy: { createdAt: 'desc' },
    });
    return row ? this.toEntity(row) : null;
  }

  async existsByCorrelationId(
    storeId: string,
    correlationId: string,
  ): Promise<boolean> {
    const count = await this.prisma.whatsappMessage.count({
      where: { storeId, correlationId },
    });
    return count > 0;
  }

  async countByCorrelationIdPrefix(
    storeId: string,
    correlationIdPrefix: string,
  ): Promise<number> {
    return this.prisma.whatsappMessage.count({
      where: {
        storeId,
        direction: 'outbound',
        correlationId: { startsWith: correlationIdPrefix },
      },
    });
  }

  async findLatestByCorrelationIdPrefix(
    storeId: string,
    correlationIdPrefix: string,
  ): Promise<WhatsappMessage | null> {
    const row = await this.prisma.whatsappMessage.findFirst({
      where: {
        storeId,
        direction: 'outbound',
        correlationId: { startsWith: correlationIdPrefix },
      },
      orderBy: { createdAt: 'desc' },
    });
    return row ? this.toEntity(row) : null;
  }

  async listByCorrelationIdPrefix(
    storeId: string,
    correlationIdPrefix: string,
    criteria: WhatsappMessageListCriteria,
  ): Promise<{ items: WhatsappMessageWithPatient[]; total: number }> {
    const search = criteria.search?.trim();
    const where = {
      storeId,
      direction: 'outbound' as const,
      correlationId: { startsWith: correlationIdPrefix },
      ...(search
        ? {
            patient: {
              name: { contains: search, mode: 'insensitive' as const },
            },
          }
        : {}),
    };

    const outboundRows = await this.prisma.whatsappMessage.findMany({
      where,
      include: { patient: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const correlationIds = outboundRows
      .map((row) => row.correlationId)
      .filter((id): id is string => Boolean(id));

    const patientIds = [...new Set(outboundRows.map((row) => row.patientId))];

    const inboundByCorrelation =
      correlationIds.length === 0
        ? []
        : await this.prisma.whatsappMessage.findMany({
            where: {
              storeId,
              direction: 'inbound',
              correlationId: { in: correlationIds },
            },
            orderBy: { createdAt: 'asc' },
          });

    const inboundByPatient =
      patientIds.length === 0
        ? []
        : await this.prisma.whatsappMessage.findMany({
            where: {
              storeId,
              direction: 'inbound',
              patientId: { in: patientIds },
            },
            orderBy: { createdAt: 'asc' },
          });

    const replyByCorrelation = new Map<
      string,
      { id: string; body: string; createdAt: Date }
    >();
    for (const inbound of inboundByCorrelation) {
      if (!inbound.correlationId) continue;
      if (replyByCorrelation.has(inbound.correlationId)) continue;
      replyByCorrelation.set(inbound.correlationId, {
        id: inbound.id,
        body: inbound.body,
        createdAt: inbound.createdAt,
      });
    }

    const usedInboundIds = new Set<string>();
    let enriched = outboundRows.map((row) => {
      const byCorrelation = row.correlationId
        ? replyByCorrelation.get(row.correlationId)
        : undefined;
      if (byCorrelation) {
        usedInboundIds.add(byCorrelation.id);
        return {
          message: this.toEntity(row),
          patientName: row.patient.name,
          replyBody: byCorrelation.body,
          repliedAt: byCorrelation.createdAt,
        };
      }

      // Fallback: 1ª inbound do paciente após o disparo (até 7 dias),
      // cobre replies antigas atribuídas a confirmação de consulta.
      const windowEnd = row.createdAt.getTime() + BIRTHDAY_REPLY_WINDOW_MS;
      const fallback = inboundByPatient.find(
        (inbound) =>
          inbound.patientId === row.patientId &&
          !usedInboundIds.has(inbound.id) &&
          inbound.createdAt.getTime() > row.createdAt.getTime() &&
          inbound.createdAt.getTime() <= windowEnd,
      );
      if (fallback) {
        usedInboundIds.add(fallback.id);
        return {
          message: this.toEntity(row),
          patientName: row.patient.name,
          replyBody: fallback.body,
          repliedAt: fallback.createdAt,
        };
      }

      return {
        message: this.toEntity(row),
        patientName: row.patient.name,
        replyBody: null,
        repliedAt: null,
      };
    });

    if (criteria.withRepliesOnly) {
      enriched = enriched.filter((item) => item.replyBody != null);
    }

    const total = enriched.length;
    const items = enriched.slice(
      criteria.skip,
      criteria.skip + criteria.take,
    );
    return { items, total };
  }

  async findByProviderMessageId(
    storeId: string,
    providerMessageId: string,
  ): Promise<WhatsappMessage | null> {
    const row = await this.prisma.whatsappMessage.findFirst({
      where: { storeId, providerMessageId },
    });
    return row ? this.toEntity(row) : null;
  }

  private toEntity(row: {
    id: string;
    storeId: string;
    patientId: string;
    appointmentId: string | null;
    direction: WhatsappMessageDirection;
    body: string;
    toE164: string;
    status: WhatsappMessageStatus;
    templateKey: WhatsappTemplateKey | null;
    providerMessageId: string | null;
    correlationId: string | null;
    expiresAt: Date | null;
    attemptCount: number;
    lastError: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): WhatsappMessage {
    return WhatsappMessage.with(
      {
        storeId: row.storeId,
        patientId: row.patientId,
        appointmentId: row.appointmentId,
        direction: row.direction,
        body: row.body,
        toE164: row.toE164,
        status: row.status,
        templateKey: row.templateKey,
        providerMessageId: row.providerMessageId,
        correlationId: row.correlationId,
        expiresAt: row.expiresAt,
        attemptCount: row.attemptCount,
        lastError: row.lastError,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}

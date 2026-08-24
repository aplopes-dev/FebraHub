import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { EncryptionService } from '../../common/crypto/encryption.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { InternalWebhookService } from './internal-webhook.service.js';
import type { RegisterWebhookDto, UpdateWebhookDto } from './dto/webhook.dto.js';

@Injectable()
export class WebhooksService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(EncryptionService) private readonly encryption: EncryptionService,
    @Inject(InternalWebhookService) private readonly internal: InternalWebhookService,
  ) {}

  register(tenantId: string, dto: RegisterWebhookDto) {
    return this.prisma.db.consumerWebhook.create({
      data: {
        tenantId,
        sourceSystem: dto.sourceSystem,
        url: dto.url,
        secretEncrypted: this.encryption.encrypt(dto.secret),
        eventTypes: dto.eventTypes ?? [],
      },
      select: {
        id: true,
        url: true,
        sourceSystem: true,
        eventTypes: true,
        status: true,
        createdAt: true,
      },
    });
  }

  list(tenantId: string) {
    return this.prisma.db.consumerWebhook.findMany({
      where: { tenantId },
      select: {
        id: true,
        url: true,
        sourceSystem: true,
        eventTypes: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateWebhookDto) {
    await this.get(tenantId, id);
    return this.prisma.db.consumerWebhook.update({
      where: { id },
      data: {
        url: dto.url,
        secretEncrypted: dto.secret ? this.encryption.encrypt(dto.secret) : undefined,
        eventTypes: dto.eventTypes,
        status: dto.status,
      },
      select: {
        id: true,
        url: true,
        sourceSystem: true,
        eventTypes: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  async test(tenantId: string, id: string) {
    const hook = await this.get(tenantId, id);
    const payload = this.internal.buildPayload({
      event: 'payment.charge.created',
      chargeId: randomUUID(),
      sourceSystem: hook.sourceSystem ?? 'test',
      externalReference: 'webhook-test',
      provider: 'STUB',
      status: 'WAITING_PAYMENT',
      amount: 1,
    });
    await this.internal.deliver({
      tenantId,
      sourceSystem: hook.sourceSystem ?? 'test',
      eventType: 'payment.charge.created',
      payload,
    });
    return { ok: true, eventId: payload.eventId };
  }

  private async get(tenantId: string, id: string) {
    const hook = await this.prisma.db.consumerWebhook.findFirst({ where: { id, tenantId } });
    if (!hook) throw new NotFoundException('Webhook não encontrado');
    return hook;
  }
}

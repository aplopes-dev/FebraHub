import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { DEFAULT_WHATSAPP_TEMPLATES } from '../../domain/default-templates';
import { WhatsappTemplate } from '../../domain/entities/whatsapp-template.entity';
import { WhatsappTemplateRepository } from '../../domain/repositories/whatsapp-template.repository.interface';
import {
  WHATSAPP_TEMPLATE_KEYS,
  type WhatsappTemplateKey,
} from '../../domain/whatsapp.types';

@Injectable()
export class PrismaWhatsappTemplateRepository extends WhatsappTemplateRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listByStore(storeId: string): Promise<WhatsappTemplate[]> {
    const rows = await this.prisma.whatsappTemplate.findMany({
      where: { storeId },
      orderBy: { key: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findByKey(
    storeId: string,
    key: WhatsappTemplateKey,
  ): Promise<WhatsappTemplate | null> {
    const row = await this.prisma.whatsappTemplate.findUnique({
      where: { storeId_key: { storeId, key } },
    });
    return row ? this.toEntity(row) : null;
  }

  async save(template: WhatsappTemplate): Promise<WhatsappTemplate> {
    const row = await this.prisma.whatsappTemplate.upsert({
      where: {
        storeId_key: { storeId: template.storeId, key: template.key },
      },
      create: {
        id: template.id,
        storeId: template.storeId,
        key: template.key,
        body: template.body,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      },
      update: {
        body: template.body,
        updatedAt: template.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  async ensureDefaults(storeId: string): Promise<WhatsappTemplate[]> {
    for (const key of WHATSAPP_TEMPLATE_KEYS) {
      const existing = await this.findByKey(storeId, key);
      if (!existing) {
        await this.save(
          WhatsappTemplate.create({
            storeId,
            key,
            body: DEFAULT_WHATSAPP_TEMPLATES[key],
          }),
        );
      }
    }
    return this.listByStore(storeId);
  }

  private toEntity(row: {
    id: string;
    storeId: string;
    key: WhatsappTemplateKey;
    body: string;
    createdAt: Date;
    updatedAt: Date;
  }): WhatsappTemplate {
    return WhatsappTemplate.with(
      {
        storeId: row.storeId,
        key: row.key,
        body: row.body,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}

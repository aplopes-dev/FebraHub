import { WhatsappTemplate } from '../domain/entities/whatsapp-template.entity';
import { DEFAULT_WHATSAPP_TEMPLATES } from '../domain/default-templates';
import type { WhatsappTemplateRepository } from '../domain/repositories/whatsapp-template.repository.interface';
import {
  WHATSAPP_TEMPLATE_KEYS,
  type WhatsappTemplateKey,
} from '../domain/whatsapp.types';

export class InMemoryWhatsappTemplateRepository implements WhatsappTemplateRepository {
  private readonly rows = new Map<string, WhatsappTemplate>();

  private key(storeId: string, templateKey: WhatsappTemplateKey): string {
    return `${storeId}:${templateKey}`;
  }

  listByStore(storeId: string): Promise<WhatsappTemplate[]> {
    return Promise.resolve(
      Array.from(this.rows.values()).filter((t) => t.storeId === storeId),
    );
  }

  findByKey(
    storeId: string,
    key: WhatsappTemplateKey,
  ): Promise<WhatsappTemplate | null> {
    return Promise.resolve(this.rows.get(this.key(storeId, key)) ?? null);
  }

  save(template: WhatsappTemplate): Promise<WhatsappTemplate> {
    this.rows.set(this.key(template.storeId, template.key), template);
    return Promise.resolve(template);
  }

  async ensureDefaults(storeId: string): Promise<WhatsappTemplate[]> {
    const result: WhatsappTemplate[] = [];
    for (const key of WHATSAPP_TEMPLATE_KEYS) {
      const existing = await this.findByKey(storeId, key);
      if (existing) {
        result.push(existing);
        continue;
      }
      const created = WhatsappTemplate.create({
        storeId,
        key,
        body: DEFAULT_WHATSAPP_TEMPLATES[key],
      });
      await this.save(created);
      result.push(created);
    }
    return result;
  }
}

import type { WhatsappTemplate } from '../entities/whatsapp-template.entity';
import type { WhatsappTemplateKey } from '../whatsapp.types';

export abstract class WhatsappTemplateRepository {
  abstract listByStore(storeId: string): Promise<WhatsappTemplate[]>;
  abstract findByKey(
    storeId: string,
    key: WhatsappTemplateKey,
  ): Promise<WhatsappTemplate | null>;
  abstract save(template: WhatsappTemplate): Promise<WhatsappTemplate>;
  abstract ensureDefaults(storeId: string): Promise<WhatsappTemplate[]>;
}

import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { WhatsappTemplateRepository } from '../../../domain/repositories/whatsapp-template.repository.interface';
import type { WhatsappTemplateKey } from '../../../domain/whatsapp.types';

export type ListWhatsappTemplatesInput = { storeId: string };

export type WhatsappTemplateItem = {
  key: WhatsappTemplateKey;
  body: string;
  updatedAt: string;
};

@Injectable()
export class ListWhatsappTemplatesUseCase
  implements IUseCase<ListWhatsappTemplatesInput, WhatsappTemplateItem[]>
{
  constructor(
    private readonly templateRepository: WhatsappTemplateRepository,
  ) {}

  async execute(
    input: ListWhatsappTemplatesInput,
  ): Promise<WhatsappTemplateItem[]> {
    const templates = await this.templateRepository.ensureDefaults(
      input.storeId,
    );
    return templates.map((t) => ({
      key: t.key,
      body: t.body,
      updatedAt: t.updatedAt.toISOString(),
    }));
  }
}

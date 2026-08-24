import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { WhatsappTemplateNotFoundError } from '../../../domain/errors/whatsapp.errors';
import { WhatsappTemplateRepository } from '../../../domain/repositories/whatsapp-template.repository.interface';
import type { WhatsappTemplateKey } from '../../../domain/whatsapp.types';

export type UpdateWhatsappTemplatesInput = {
  storeId: string;
  items: Array<{ key: WhatsappTemplateKey; body: string }>;
};

@Injectable()
export class UpdateWhatsappTemplatesUseCase
  implements IUseCase<UpdateWhatsappTemplatesInput, void>
{
  constructor(
    private readonly templateRepository: WhatsappTemplateRepository,
  ) {}

  async execute(input: UpdateWhatsappTemplatesInput): Promise<void> {
    await this.templateRepository.ensureDefaults(input.storeId);

    for (const item of input.items) {
      const template = await this.templateRepository.findByKey(
        input.storeId,
        item.key,
      );
      if (!template) {
        throw new WhatsappTemplateNotFoundError(
          UpdateWhatsappTemplatesUseCase.name,
          item.key,
        );
      }
      template.updateBody(item.body.trim());
      await this.templateRepository.save(template);
    }
  }
}

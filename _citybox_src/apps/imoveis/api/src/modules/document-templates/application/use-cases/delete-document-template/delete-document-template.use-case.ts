import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { DocumentTemplateNotFoundError } from '../../../domain/errors/document-template-not-found.error';
import { DocumentTemplateRepository } from '../../../domain/repositories/document-template.repository.interface';

@Injectable()
export class DeleteDocumentTemplateUseCase implements IUseCase<
  { storeId: string; id: string },
  void
> {
  constructor(private readonly templates: DocumentTemplateRepository) {}

  async execute(input: { storeId: string; id: string }): Promise<void> {
    const ok = await this.templates.delete(input.storeId, input.id);
    if (!ok) throw new DocumentTemplateNotFoundError(input.id);
  }
}

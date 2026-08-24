import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { DocumentTemplateNotFoundError } from '../../../domain/errors/document-template-not-found.error';
import { DocumentTemplateEntity } from '../../../domain/entities/document-template.entity';
import { DocumentTemplateRepository } from '../../../domain/repositories/document-template.repository.interface';

@Injectable()
export class GetDocumentTemplateByIdUseCase implements IUseCase<
  { storeId: string; id: string },
  DocumentTemplateEntity
> {
  constructor(private readonly templates: DocumentTemplateRepository) {}

  async execute(input: {
    storeId: string;
    id: string;
  }): Promise<DocumentTemplateEntity> {
    const template = await this.templates.findById(input.storeId, input.id);
    if (!template) throw new DocumentTemplateNotFoundError(input.id);
    return template;
  }
}

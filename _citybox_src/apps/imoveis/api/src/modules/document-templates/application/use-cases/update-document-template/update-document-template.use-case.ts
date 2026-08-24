import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { DocumentTemplateNotFoundError } from '../../../domain/errors/document-template-not-found.error';
import { DocumentTemplateEntity } from '../../../domain/entities/document-template.entity';
import { DocumentTemplateRepository } from '../../../domain/repositories/document-template.repository.interface';
import type { ApiDocumentTemplateType } from '../../../domain/mappers/document-template-enum.mapper';

export type UpdateDocumentTemplateInput = {
  storeId: string;
  id: string;
  nome?: string;
  tipo?: ApiDocumentTemplateType;
  conteudoHtml?: string;
  ativo?: boolean;
  isDefault?: boolean;
};

@Injectable()
export class UpdateDocumentTemplateUseCase implements IUseCase<
  UpdateDocumentTemplateInput,
  DocumentTemplateEntity
> {
  constructor(private readonly templates: DocumentTemplateRepository) {}

  async execute(
    input: UpdateDocumentTemplateInput,
  ): Promise<DocumentTemplateEntity> {
    const updated = await this.templates.update(input.storeId, input.id, {
      nome: input.nome,
      tipo: input.tipo,
      conteudoHtml: input.conteudoHtml,
      ativo: input.ativo,
      isDefault: input.isDefault,
    });
    if (!updated) throw new DocumentTemplateNotFoundError(input.id);
    return updated;
  }
}
